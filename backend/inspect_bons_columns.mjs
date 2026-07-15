import pool from './config/database.js';
(async ()=>{
  try{
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='bons_sortie' ORDER BY ordinal_position");
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1); }
})();
