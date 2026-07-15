import pool from './config/database.js';
(async ()=>{
  try{
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' ORDER BY ordinal_position");
    console.log(res.rows);
    process.exit(0);
  }catch(e){ console.error('err', e); process.exit(1);} 
})();
