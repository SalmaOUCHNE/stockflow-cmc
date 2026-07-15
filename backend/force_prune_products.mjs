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
  const client = pool;
  try{
    await client.query('BEGIN');
    const res = await client.query(`SELECT id, reference FROM products WHERE reference = ANY($1)`, [keepRefs]);
    const keepIds = res.rows.map(r=>r.id);
    console.log('Keep count:', keepIds.length);
    if(keepIds.length===0){
      throw new Error('No keep ids found; aborting');
    }

    // Find all FK constraints referencing products.id
    const fkRes = await client.query(`
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'products'
        AND ccu.column_name = 'id'
    `);

    console.log('Referencing tables:', fkRes.rows);

    // For each referencing table, delete rows pointing to non-kept products
    for(const r of fkRes.rows){
      const tbl = r.table_name;
      const col = r.column_name;
      // build placeholders
      const ph = keepIds.map((_,i)=>`$${i+1}`).join(',');
      const delQuery = `DELETE FROM ${tbl} WHERE ${col} IS NULL OR ${col} NOT IN (${ph})`;
      try{
        const delRes = await client.query(delQuery, keepIds);
        console.log(`Deleted from ${tbl}:`, delRes.rowCount);
      }catch(e){
        console.error(`Failed deleting from ${tbl}:`, e.message);
      }
    }

    // Additionally delete from common tables by name if present
    const extras = ['inventory_lines','stock_movements','product_history','audit_logs'];
    for(const t of extras){
      const exists = await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1)`, [t]);
      if(exists.rows[0].exists){
        // try to detect column
        const colRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name IN ('product_id','entite_id','entity_id')`, [t]);
        if(colRes.rows.length>0){
          const col = colRes.rows[0].column_name;
          const ph = keepIds.map((_,i)=>`$${i+1}`).join(',');
          try{
            const del = await client.query(`DELETE FROM ${t} WHERE ${col} IS NULL OR ${col} NOT IN (${ph})`, keepIds);
            console.log(`Deleted from ${t} by ${col}:`, del.rowCount);
          }catch(e){ console.error(`Failed delete from ${t}:`, e.message); }
        }else{
          // fallback: if audit_logs has entite_cible and entite_id
          if(t==='audit_logs'){
            try{
              const del = await client.query(`DELETE FROM audit_logs WHERE entite_cible='product' AND (entite_id IS NULL OR entite_id NOT IN (${keepIds.map((_,i)=>`$${i+1}`).join(',')}))`, keepIds);
              console.log('Deleted audit_logs product entries:', del.rowCount);
            }catch(e){ console.error('audit_logs delete failed:', e.message); }
          }
        }
      }
    }

    // Now safe to delete products not in keep list
    const ph2 = keepIds.map((_,i)=>`$${i+1}`).join(',');
    const delProducts = await client.query(`DELETE FROM products WHERE id NOT IN (${ph2})`, keepIds);
    console.log('Deleted products:', delProducts.rowCount);

    await client.query('COMMIT');
    console.log('Force prune completed');
    await client.end();
    process.exit(0);
  }catch(e){
    console.error('Force prune error:', e);
    await client.query('ROLLBACK').catch(()=>{});
    process.exit(1);
  }
}

main();
