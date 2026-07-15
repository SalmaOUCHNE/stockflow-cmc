import fs from 'fs';
import pool from './config/database.js';

async function runChecks(){
  const report = { timestamp: new Date().toISOString(), checks: {}, errors: [] };
  try{
    // 1. Products count with SKU prefix
    const r1 = await pool.query("SELECT COUNT(*)::int as count FROM products WHERE reference LIKE 'SKU-%'");
    report.checks.sku_products = r1.rows[0].count;

    // 2. Total products
    const r1b = await pool.query('SELECT COUNT(*)::int as count FROM products');
    report.checks.total_products = r1b.rows[0].count;

    // 3. Required product columns existence
    const requiredCols = ['reference','code_article','libelle','description','category_id','unite_mesure','stock_actuel','seuil_alerte','fournisseur','emplacement','prix_unitaire','photo_url','date_entree'];
    const colsRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='products' AND column_name = ANY($1)`, [requiredCols]);
    const presentCols = colsRes.rows.map(r=>r.column_name);
    report.checks.product_columns_present = presentCols;
    report.checks.product_columns_missing = requiredCols.filter(c=>!presentCols.includes(c));

    // 4. Category linkage: products with non-null category and existing category
    const catRes = await pool.query(`SELECT COUNT(*)::int as linked_count FROM products p JOIN categories c ON p.category_id = c.id`);
    report.checks.products_with_category_link = catRes.rows[0].linked_count;

    // 5. Poles and filieres counts and sample
    const poles = await pool.query('SELECT count(*)::int as count FROM poles');
    const filieres = await pool.query('SELECT count(*)::int as count FROM filieres');
    const polesSample = await pool.query('SELECT id, nom FROM poles ORDER BY nom LIMIT 10');
    const filieresSample = await pool.query('SELECT id, libelle, pole_id FROM filieres ORDER BY libelle LIMIT 10');
    report.checks.poles_count = poles.rows[0].count;
    report.checks.filieres_count = filieres.rows[0].count;
    report.checks.poles_sample = polesSample.rows;
    report.checks.filieres_sample = filieresSample.rows;

    // 6. Movements counts by type
    const mv = await pool.query(`SELECT type, COUNT(*)::int as count FROM stock_movements GROUP BY type`);
    report.checks.movements_by_type = mv.rows;

    // 7. Bons by statut
    const bs = await pool.query(`SELECT statut, COUNT(*)::int as count FROM bons_sortie GROUP BY statut`);
    report.checks.bons_by_statut = bs.rows;

    // 8. Inventories and lines
    const inv = await pool.query('SELECT COUNT(*)::int as count FROM inventories');
    const invLines = await pool.query('SELECT COUNT(*)::int as count FROM inventory_lines');
    report.checks.inventories_count = inv.rows[0].count;
    report.checks.inventory_lines_count = invLines.rows[0].count;

    // 9. Users status distribution
    const us = await pool.query("SELECT status, COUNT(*)::int as count FROM users GROUP BY status");
    report.checks.users_status = us.rows;

    // 10. Pending user sample
    const pend = await pool.query("SELECT id, email, date_demande, status, is_active FROM users WHERE status = 'pending' ORDER BY created_at LIMIT 10");
    report.checks.pending_users_sample = pend.rows;

    // 11. Stock consistency: products where stock_actuel != computed sum(movements)
    const inconsist = await pool.query(`
      SELECT p.reference, p.libelle, p.stock_actuel, COALESCE(SUM(CASE WHEN sm.type='entree' THEN sm.quantite WHEN sm.type='sortie' THEN -sm.quantite ELSE 0 END),0) AS computed
      FROM products p
      LEFT JOIN stock_movements sm ON sm.product_id = p.id
      GROUP BY p.reference, p.libelle, p.stock_actuel
      HAVING p.stock_actuel != GREATEST(0, COALESCE(SUM(CASE WHEN sm.type='entree' THEN sm.quantite WHEN sm.type='sortie' THEN -sm.quantite ELSE 0 END),0))
      LIMIT 50
    `);
    report.checks.stock_inconsistencies = inconsist.rows;

    // 12. Products with photos
    const photos = await pool.query("SELECT COUNT(*)::int as count FROM products WHERE photo_url IS NOT NULL AND photo_url <> ''");
    const photoSample = await pool.query("SELECT reference, libelle, photo_url FROM products WHERE photo_url IS NOT NULL AND photo_url <> '' ORDER BY libelle LIMIT 10");
    report.checks.products_with_photos = photos.rows[0].count;
    report.checks.photo_sample = photoSample.rows;

    // 13. Notifications count
    const notif = await pool.query('SELECT COUNT(*)::int as count FROM notifications');
    report.checks.notifications_count = notif.rows[0].count;

    // 14. Quick API sanity: ensure GET /api/poles, /api/filieres, /api/categories work if server running on localhost:3000
    let apiChecks = { serverUp: false };
    try{
      const res = await fetch('http://localhost:3000/api/poles');
      apiChecks.serverUp = true;
      apiChecks.poles = { status: res.status };
    }catch(e){ apiChecks.serverUp = false; }
    report.checks.api = apiChecks;

    // 15. Summary verdicts
    report.summary = {
      products_ok: report.checks.sku_products >= 30 && report.checks.total_products >= 30,
      categories_linked: report.checks.products_with_category_link >= report.checks.sku_products,
      poles_filieres_present: report.checks.poles_count > 0 && report.checks.filieres_count > 0,
      movements_exist: (report.checks.movements_by_type && report.checks.movements_by_type.length>0),
      bons_exist: (report.checks.bons_by_statut && report.checks.bons_by_statut.length>0),
      inventories_exist: report.checks.inventories_count >= 6,
      users_pending_exist: (report.checks.pending_users_sample && report.checks.pending_users_sample.length>0),
    };

  }catch(err){
    console.error('check run error', err);
    report.errors.push(err && (err.stack||err.message||err));
  }

  // write report
  fs.writeFileSync('./backend/demo_verification_report.json', JSON.stringify(report, null, 2));
  console.log('Report written to backend/demo_verification_report.json');
  console.log(JSON.stringify(report.summary, null, 2));
  await pool.end();
}

runChecks().then(()=>process.exit(0)).catch(e=>{console.error(e); process.exit(1);});
