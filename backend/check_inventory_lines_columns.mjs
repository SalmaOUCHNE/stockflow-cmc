import pool from './config/database.js';
(async()=>{
  try{
    const r = await pool.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='inventory_lines'");
    console.log(JSON.stringify(r.rows,null,2));
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1);} 
})();
