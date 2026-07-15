import pool from './config/database.js';
import fs from 'fs';
import path from 'path';
// use global fetch (Node 18+)


async function main(){
  const report = { timestamp: new Date().toISOString(), products_total: 0, products: [], summary: {} };
  try{
    // detect product columns
    const colRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='products'");
    const cols = colRes.rows.map(r=>r.column_name);

    const reqCols = ['id','reference','code_article','libelle','description','category_id','pole_id','filiere_id','unite_mesure','emplacement','fournisseur','prix_unitaire','stock_actuel','seuil_alerte','date_entree','photo_url','qr_code','date_achat','date_expiration'];
    const present = reqCols.filter(c=>cols.includes(c));

    const prodRes = await pool.query('SELECT * FROM products ORDER BY created_at LIMIT 100');
    const products = prodRes.rows;
    report.products_total = products.length;

    for(const p of products){
      const item = { id: p.id, reference: p.reference || p.libelle || null, checks: {}, raw: {} };
      // check required fields
      for(const c of reqCols){
        item.checks[c] = (p[c] !== undefined && p[c] !== null && String(p[c]).trim() !== '') ? 'ok' : (cols.includes(c) ? 'missing' : 'n/a');
      }
      // movements count
      const mv = await pool.query('SELECT COUNT(*)::int as cnt FROM stock_movements WHERE product_id = $1',[p.id]);
      item.movements = mv.rows[0].cnt;
      // audit count
      const au = await pool.query("SELECT COUNT(*)::int as cnt FROM audit_logs WHERE entite_id = $1 OR (details->>'product' = $2)",[p.id, p.reference]);
      item.audit_logs = au.rows[0].cnt;
      // image accessibility
      const photo = p.photo_url || p.image_url || p.photo || '';
      item.photo_url = photo || null;
      item.photo_accessible = 'unknown';
      try{
        if(photo && photo.startsWith('/')){
          const uploadsDir = path.resolve('backend','public',photo.replace(/^\//,''));
          item.photo_accessible = fs.existsSync(uploadsDir) ? 'ok' : 'missing_file';
        } else if(photo){
          const res = await fetch(photo, { method: 'HEAD', redirect: 'follow' , timeout: 5000});
          item.photo_accessible = (res && (res.status===200 || res.status===302 || res.status===304)) ? 'ok' : `http_${res ? res.status : 'err'}`;
        } else item.photo_accessible = 'no_photo';
      }catch(e){ item.photo_accessible = 'error'; }

      // QR code check
      if(cols.includes('qr_code')){
        item.qr_code = p.qr_code ? 'ok' : 'missing';
      } else item.qr_code = 'n/a';

      report.products.push(item);
    }

    // general counts
    const counts = {};
    const tables = ['products','stock_movements','audit_logs','inventories','inventory_lines','bons_sortie','users'];
    for(const t of tables){
      try{ const r = await pool.query(`SELECT COUNT(*)::int as cnt FROM ${t}`); counts[t]=r.rows[0].cnt; } catch(e){ counts[t]=null; }
    }
    report.summary.counts = counts;

    // check audit page data source: verify API endpoints available
    const apiChecks = {};
    try{ const poles = await pool.query("SELECT COUNT(*)::int as cnt FROM poles"); apiChecks.poles = poles.rows[0].cnt; }catch(e){ apiChecks.poles = null; }
    report.summary.apiChecks = apiChecks;

    fs.writeFileSync('backend/final_checks_results.json', JSON.stringify(report,null,2));
    console.log('final_checks_results.json written');
    await pool.end();
    process.exit(0);
  }catch(e){
    console.error('check failed', e);
    fs.writeFileSync('backend/final_checks_results.json', JSON.stringify({ error: String(e) }, null, 2));
    process.exit(1);
  }
}

main();
