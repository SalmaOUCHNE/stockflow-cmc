import bcrypt from 'bcrypt';
import { Client } from 'pg';

(async function(){
  const dbUrl = process.env.DATABASE_URL;
  if(!dbUrl){ console.error('DATABASE_URL missing'); process.exit(1); }
  const c = new Client({ connectionString: dbUrl });
  try{
    await c.connect();
    const newPass = 'AdminPass123!';
    const hash = await bcrypt.hash(newPass, 10);
    await c.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'admin@stockflow.local']);
    console.log('Updated admin@stockflow.local password to AdminPass123!');
    await c.end();
    console.log('Done');
  }catch(e){ console.error(e); process.exit(1); }
})();
