import pool from './config/database.js';
(async ()=>{
  try{
    const res = await pool.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='users'");
    console.log(JSON.stringify(res.rows,null,2));
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1);} 
})();
