import pool from './config/database.js';

async function main(){
  try{
    const countRes = await pool.query('SELECT COUNT(*)::int as cnt FROM products');
    console.log('PRODUCT_COUNT', countRes.rows[0].cnt);
    const list = await pool.query("SELECT id, reference, code_article, libelle, stock_actuel FROM products ORDER BY created_at DESC LIMIT 100");
    console.log('PRODUCT_LIST', JSON.stringify(list.rows, null, 2));
    await pool.end();
    process.exit(0);
  }catch(e){
    console.error('ERROR_QUERY', e);
    process.exit(1);
  }
}

main();
