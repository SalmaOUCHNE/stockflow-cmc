import pool from './config/database.js';

const keepRefs = [
  'DELL-LAT-5420',
  'HP-LJ-PRO-M404dn',
  'MACBOOK-PRO-M3-14',
  'PELTOR-X4',
  'GANTS-NITRILE-100',
  'KIT-MAINT-TOOLS',
  'WERA-7P',
  'PAPIER-A4-80G',
  'CART-CANON-PG545',
  'CABLE-CAT6-5M'
];

async function main(){
  try{
    await pool.query('BEGIN');
    const res = await pool.query(`SELECT id, reference FROM products WHERE reference = ANY($1)`, [keepRefs]);
    const found = res.rows.map(r=>r.id);
    console.log('Found keep ids count:', found.length);
    if(found.length !== keepRefs.length){
      console.warn('Warning: some canonical references were not found in DB. Found:', res.rows.map(r=>r.reference));
    }

    // Build placeholders for NOT IN
    function placeholders(arr, start=1){
      return arr.map((_,i)=>`$${i+start}`).join(',');
    }

    // Delete dependent records referencing other products
    if(found.length>0){
      const ph = placeholders(found);
      const delStock = await pool.query(`DELETE FROM stock_movements WHERE product_id NOT IN (${ph})`, found);
      console.log('Deleted stock_movements:', delStock.rowCount);
      // inventory_lines
      try{
        const delInvLines = await pool.query(`DELETE FROM inventory_lines WHERE product_id NOT IN (${ph})`, found);
        console.log('Deleted inventory_lines:', delInvLines.rowCount);
      }catch(e){ console.log('inventory_lines table missing or delete failed:', e.message); }
      // product_history
      try{
        const delHist = await pool.query(`DELETE FROM product_history WHERE product_id NOT IN (${ph})`, found);
        console.log('Deleted product_history:', delHist.rowCount);
      }catch(e){ console.log('product_history missing or delete failed:', e.message); }
      // audit_logs referencing products
      try{
        const delAudit = await pool.query(`DELETE FROM audit_logs WHERE entite_cible = 'product' AND (entite_id IS NULL OR entite_id NOT IN (${ph}))`, found);
        console.log('Deleted audit_logs (product entries):', delAudit.rowCount);
      }catch(e){ console.log('audit_logs delete failed (maybe different schema):', e.message); }

      // Finally delete products not in keep list
      const delProd = await pool.query(`DELETE FROM products WHERE id NOT IN (${ph})`, found);
      console.log('Deleted products:', delProd.rowCount);
    }else{
      console.log('No canonical products found; aborting deletion to avoid full wipe.');
    }

    await pool.query('COMMIT');
    console.log('Prune completed');
    await pool.end();
    process.exit(0);
  }catch(e){
    console.error('Error during prune:', e);
    await pool.query('ROLLBACK').catch(()=>{});
    process.exit(1);
  }
}

main();
