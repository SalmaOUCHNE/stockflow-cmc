import fs from 'fs';
import pool from './config/database.js';

async function run(){
  const sql = fs.readFileSync(new URL('./seed_demo_more.sql', import.meta.url), 'utf8');
  try{
    console.log('Running seed_demo_more...');
    await pool.query(sql);
    console.log('seed_demo_more executed successfully');
    process.exit(0);
  }catch(err){
    console.error('Error running seed_demo_more:', err && (err.message || err));
    process.exit(1);
  }
}

run();
