import pool from './config/database.js';
(async()=>{
  try{
    const r = await pool.query('SELECT * FROM roles ORDER BY id');
    console.log(JSON.stringify(r.rows,null,2));
    await pool.end();
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1); }
})();
