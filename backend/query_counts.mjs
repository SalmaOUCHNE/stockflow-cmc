import pool from './config/database.js';
(async ()=>{
  try{
    const tables = ['products','stock_movements','audit_logs','inventories','inventory_lines','bons_sortie','users'];
    const out = {};
    for(const t of tables){
      const r = await pool.query(`SELECT COUNT(*)::int as count FROM ${t}`);
      out[t] = r.rows[0].count;
    }
    console.log(JSON.stringify(out,null,2));
    await pool.end();
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1); }
})();
