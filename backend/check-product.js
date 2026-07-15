import pool from './config/database.js';

async function run() {
  try {
    const res = await pool.query("SELECT id, reference, libelle, stock_actuel FROM products WHERE reference = $1", ['TEST-001']);
    console.log('rows:', res.rows.length);
    console.log(res.rows[0]);
  } catch (e) {
    console.error('error', e.message);
  } finally {
    process.exit(0);
  }
}

run();
