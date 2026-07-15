import fs from 'fs';
import pool from './config/database.js';

async function run() {
  const sql = fs.readFileSync(new URL('./seed_demo_products_and_movements.sql', import.meta.url), 'utf8');
  try {
    console.log('Running demo seed...');
    await pool.query(sql);
    console.log('Demo seed executed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error executing demo seed:', err.message || err);
    process.exit(1);
  }
}

run();
