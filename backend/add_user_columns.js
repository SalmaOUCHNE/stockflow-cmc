import { Client } from 'pg';
(async ()=>{
  const dbUrl = process.env.DATABASE_URL;
  if(!dbUrl){ console.error('DATABASE_URL missing'); process.exit(1); }
  const c = new Client({ connectionString: dbUrl });
  try{
    await c.connect();
    await c.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)");
    await c.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS fonction VARCHAR(100)");
    console.log('Ensured avatar_url and fonction columns present');
    await c.end();
  }catch(e){ console.error(e); process.exit(1); }
})();
