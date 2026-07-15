import pool from './config/database.js';
import { v4 as uuidv4 } from 'uuid';

async function run(){
  const client = pool;
  try{
    await client.query('BEGIN');

    // Actions to generate
    const actions = [
      'auth.login', 'create.product', 'update.product', 'stock.entree', 'stock.sortie', 'bon.validate', 'inventory.create', 'user.approve', 'export.pdf', 'export.excel'
    ];

    // Create sample users if missing
    const usersRes = await client.query("SELECT id,email FROM users LIMIT 10");
    let adminId = null;
    const adminRow = await client.query("SELECT id FROM users WHERE email='admin@stockflow.local' LIMIT 1");
    if(adminRow.rows[0]) adminId = adminRow.rows[0].id;
    else {
      const u = await client.query("INSERT INTO users(prenom,nom,email,password_hash,status,role_id,created_at) VALUES($1,$2,$3,$4,$5,$6,NOW()) RETURNING id", ['Admin','Seed','admin@stockflow.local','AdminPass123!','approved', 'Admin']);
      adminId = u.rows[0].id;
    }

    // create a couple of demo users
    const demoUsers = ['tech1@cmc.local','tech2@cmc.local','manager@cmc.local','approver@cmc.local'];
    const demoIds = [];
    for(const e of demoUsers){
      const r = await client.query('SELECT id FROM users WHERE email=$1 LIMIT 1', [e]);
      if(r.rows[0]) demoIds.push(r.rows[0].id);
      else {
        const ins = await client.query('INSERT INTO users(prenom,nom,email,password_hash,status,role_id,created_at) VALUES($1,$2,$3,$4,$5,$6,NOW()) RETURNING id', [e.split('@')[0], '', e, 'Password123!', 'approved', 'Utilisateur']);
        demoIds.push(ins.rows[0].id);
      }
    }

    // Ensure there are some bons_sortie table
    const bonsTable = (await client.query("SELECT to_regclass('public.bons_sortie') as exists")).rows[0].exists ? 'bons_sortie' : ((await client.query("SELECT to_regclass('public.bons') as exists")).rows[0].exists ? 'bons' : null);

    // Get existing product ids (should be 10)
    const prods = await client.query('SELECT id,reference,stock_actuel FROM products');
    const products = prods.rows;
    if(products.length === 0){
      throw new Error('No products present to generate movements');
    }

    // Generate 50 audit logs across actions, rotating users and products
    for(let i=0;i<50;i++){
      const act = actions[i % actions.length];
      const prod = products[i % products.length];
      const user = demoIds[i % demoIds.length] || adminId;
      // Use adminId for movements to avoid FK issues if demo users missing
      const movementUser = adminId;
      const details = {
        note: `Seed audit ${i+1} - ${act}`,
        product_ref: prod.reference,
        product_id: prod.id,
      };
      await client.query(`INSERT INTO audit_logs(action, entite_cible, entite_id, details, created_at) VALUES($1,$2,$3,$4,NOW() - $5::interval)`, [act, 'product', prod.id, JSON.stringify(details), `${i * 7} minutes`]);

      // create associated movements or bons for certain actions
      if(act === 'stock.entree'){
        const q = Math.max(1, Math.floor((prod.stock_actuel || 10) * 0.1));
        await client.query('INSERT INTO stock_movements(product_id,user_id,type,quantite,motif,date_mouvement) VALUES($1,$2,$3,$4,$5,NOW() - $6::interval)', [prod.id, movementUser, 'entree', q, 'Seed audit entree', `${i} minutes`]);
      }
      if(act === 'stock.sortie'){
        const q = Math.max(1, Math.floor((prod.stock_actuel || 10) * 0.05));
        await client.query('INSERT INTO stock_movements(product_id,user_id,type,quantite,motif,date_mouvement) VALUES($1,$2,$3,$4,$5,NOW() - $6::interval)', [prod.id, movementUser, 'sortie', q, 'Seed audit sortie', `${i} minutes`]);
      }
      if(act === 'create.product'){
        // duplicate small product creation audit (no real create)
      }
      if(act === 'bon.validate' && bonsTable){
        // insert a bon and mark validated
        const bonId = uuidv4();
        try{
          await client.query(`INSERT INTO ${bonsTable}(id, product_id, quantite, demandeur_id, statut, created_at) VALUES($1,$2,$3,$4,$5,NOW() - $6::interval)`, [bonId, prod.id, 1, adminId, 'valide', `${i} minutes`]);
        }catch(e){ /* ignore if schema differs */ }
      }
    }

    // Create inventory sessions: open, closed, with positive and negative discrepancies
    // Create 3 sessions: open, closed with positive variance, closed with negative variance
    const invs = [];
    for(const s of ['Inventaire ouvert T2 2026','Inventaire clôturé - surplus','Inventaire clôturé - déficit']){
      const invId = uuidv4();
      try{
        await client.query(`INSERT INTO inventories(id,title,created_at,status,created_by) VALUES($1,$2,NOW(),$3,$4)`, [invId, s, s.includes('ouvert') ? 'open' : 'closed', adminId]);
        invs.push(invId);
      }catch(e){ /* ignore if table missing */ }
    }

    // For each inventory, insert lines for products with discrepancies
    for(let idx=0; idx<invs.length; idx++){
      const invId = invs[idx];
      for(let j=0;j<products.length;j++){
        const prod = products[j];
        const theo = prod.stock_actuel ?? 0;
        let phys = theo;
        if(idx === 1 && j % 3 === 0) phys = theo + Math.max(1, Math.floor(theo * 0.1)); // positive variance
        if(idx === 2 && j % 4 === 0) phys = Math.max(0, theo - Math.max(1, Math.floor(theo * 0.15))); // negative variance
        try{
          const ecart = phys - theo;
          try{
            await client.query(`INSERT INTO inventory_lines(id, inventory_id, product_id, stock_theorique, stock_physique, ecart, motif_ecart) VALUES($1,$2,$3,$4,$5,$6,$7)`, [uuidv4(), invId, prod.id, theo, phys, ecart, ecart === 0 ? 'OK' : (ecart > 0 ? 'Surplus détecté' : 'Manque détecté')]);
          }catch(e){ /* ignore */ }
        }catch(e){ /* ignore */ }
      }
      // close second and third inventories
      if(idx > 0){
        try{ await client.query('UPDATE inventories SET status=$1, closed_at=NOW() WHERE id=$2', ['closed', invId]); }catch(e){}
      }
    }

    // Ensure exports audit entries exist
    for(let k=0;k<5;k++){
      const prod = products[k % products.length];
      await client.query(`INSERT INTO audit_logs(action, entite_cible, entite_id, details, created_at) VALUES($1,$2,$3,$4,NOW() - $5::interval)`, ['export.pdf','product', prod.id, JSON.stringify({note:'Seed export pdf',product:prod.reference}), `${k*3} minutes`]);
            await client.query(`INSERT INTO audit_logs(action, entite_cible, entite_id, details, created_at) VALUES($1,$2,$3,$4,NOW() - $5::interval)`, ['export.excel','product', prod.id, JSON.stringify({note:'Seed export excel',product:prod.reference}), `${k*3+1} minutes`]);
    }

    await client.query('COMMIT');

    // Print counts
    const counts = await Promise.all([
      client.query('SELECT COUNT(*)::int as cnt FROM products'),
      client.query('SELECT COUNT(*)::int as cnt FROM stock_movements'),
      client.query('SELECT COUNT(*)::int as cnt FROM audit_logs'),
      client.query("SELECT to_regclass('public.bons_sortie') as b1"),
      client.query("SELECT to_regclass('public.bons') as b2"),
      client.query("SELECT COUNT(*)::int as cnt FROM inventories"),
      client.query("SELECT COUNT(*)::int as cnt FROM inventory_lines")
    ]);

    console.log('COUNTS', {
      products: counts[0].rows[0].cnt,
      stock_movements: counts[1].rows[0].cnt,
      audit_logs: counts[2].rows[0].cnt,
      bons_sortie_table: counts[3].rows[0].b1 || counts[4].rows[0].b2 ? true : false,
      inventories: counts[5].rows[0].cnt,
      inventory_lines: counts[6].rows[0].cnt,
    });

    process.exit(0);
  }catch(e){
    console.error('Seed audit/inventories error', e);
    await client.query('ROLLBACK').catch(()=>{});
    process.exit(1);
  }
}

run();
