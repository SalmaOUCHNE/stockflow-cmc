import pool from './config/database.js';

async function main(){
  try{
    console.log('Calculating computed stock per product from stock_movements...');
    const res = await pool.query(`
      SELECT p.id, p.reference,
             COALESCE(SUM(CASE WHEN sm.type = 'entree' THEN sm.quantite WHEN sm.type = 'sortie' THEN -sm.quantite ELSE 0 END),0)::int as computed
      FROM products p
      LEFT JOIN stock_movements sm ON sm.product_id = p.id
      GROUP BY p.id, p.reference
    `);

    for(const row of res.rows){
      const { id, reference, computed } = row;
      await pool.query('UPDATE products SET stock_actuel = $1 WHERE id = $2', [Math.max(0, computed), id]);
      console.log(`Updated ${reference} -> stock_actuel=${Math.max(0, computed)}`);
    }

    // report final inconsistencies
    const inconsist = await pool.query(`
      SELECT p.reference, p.libelle, p.stock_actuel, COALESCE(SUM(CASE WHEN sm.type='entree' THEN sm.quantite WHEN sm.type='sortie' THEN -sm.quantite ELSE 0 END),0) AS computed
      FROM products p
      LEFT JOIN stock_movements sm ON sm.product_id = p.id
      GROUP BY p.reference, p.libelle, p.stock_actuel
      HAVING p.stock_actuel != GREATEST(0, COALESCE(SUM(CASE WHEN sm.type='entree' THEN sm.quantite WHEN sm.type='sortie' THEN -sm.quantite ELSE 0 END),0))
    `);

    if(inconsist.rows.length === 0){
      console.log('All product stock_actuel values are now consistent with movements.');
    } else {
      console.log('Remaining inconsistencies:');
      console.log(JSON.stringify(inconsist.rows, null, 2));
    }

    await pool.end();
    process.exit(0);
  }catch(e){
    console.error('fix failed', e);
    process.exit(1);
  }
}

main();
