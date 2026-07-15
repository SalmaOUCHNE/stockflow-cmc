import pool from './config/database.js';

async function run(){
  try{
    console.log('Adding updated_at column to products if missing...');
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP");
    console.log('ALTER TABLE completed');
    process.exit(0);
  }catch(e){
    console.error('Error applying ALTER TABLE:', e && (e.stack || e.message || e));
    process.exit(1);
  }
}

run();
