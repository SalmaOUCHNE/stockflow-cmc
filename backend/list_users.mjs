import pool from './config/database.js';
(async()=>{
  try{
    const r = await pool.query('SELECT id, prenom, nom, email, role_id, status FROM users ORDER BY created_at DESC LIMIT 50');
    console.log(JSON.stringify(r.rows,null,2));
    await pool.end();
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1);} 
})();
