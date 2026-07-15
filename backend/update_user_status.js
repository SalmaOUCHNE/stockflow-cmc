import { Client } from 'pg';

(async function(){
  const dbUrl = process.env.DATABASE_URL;
  if(!dbUrl){ console.error('DATABASE_URL missing'); process.exit(1); }
  const c = new Client({ connectionString: dbUrl });
  try{
    await c.connect();
    const res = await c.query('UPDATE users SET status=$1 WHERE email=$2 RETURNING id, email, status', ['active','pending.user@example.com']);
    console.log(JSON.stringify(res.rows,null,2));
    await c.end();
  }catch(e){ console.error(e); process.exit(1); }
})();
