import pool from './config/database.js';
(async()=>{
  try{
    const r = await pool.query("SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conname='users_role_id_fkey'");
    console.log(JSON.stringify(r.rows,null,2));
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1);} 
})();
