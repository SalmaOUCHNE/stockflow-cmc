import { Client } from 'pg';
(async ()=>{
  const dbUrl = process.env.DATABASE_URL;
  if(!dbUrl){ console.error('DATABASE_URL missing'); process.exit(1); }
  const c = new Client({ connectionString: dbUrl });
  try{ await c.connect(); const r = await c.query('SELECT id,email FROM users WHERE email=$1 LIMIT 1',['e2e.user@example.com']); console.log(JSON.stringify(r.rows,null,2)); await c.end(); } catch(e){ console.error(e); process.exit(1); }
})();
