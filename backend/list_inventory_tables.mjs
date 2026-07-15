import pool from './config/database.js';
(async()=>{
  try{
    const r=await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%invent%' ORDER BY table_name");
    console.log(JSON.stringify(r.rows,null,2));
    await pool.end();
    process.exit(0);
  }catch(e){console.error(e);process.exit(1);} })();
