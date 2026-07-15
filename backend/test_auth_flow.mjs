import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const base = 'http://localhost:3000/api';

async function req(path, options = {}){
  try{
    const res = await fetch(base+path, options);
    const text = await res.text();
    let body;
    try{ body = JSON.parse(text); }catch(e){ body = text; }
    console.log('[HTTP]', options.method || 'GET', path, 'STATUS', res.status);
    console.log(JSON.stringify(body, null, 2));
    return { status: res.status, body };
  }catch(e){
    console.error('[HTTP] fetch error for', path, e && (e.stack||e.message||e));
    return { error: e };
  }
}

(async ()=>{
  console.log('[TEST] Starting auth flow tests');

  // 1) SELECT users via direct DB query is separate script; here do HTTP tests
  console.log('\n[TEST] POST /auth/login admin');
  await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cmc.ma', password: 'admin123' })
  });

  console.log('\n[TEST] POST /auth/login user');
  await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@cmc.ma', password: 'user123' })
  });

  console.log('\n[TEST] POST /auth/register new user');
  const mail = 'test+'+Date.now()+'@cmc.ma';
  const reg = await req('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: 'Tester Demo', email: mail, password: 'Testpass123' })
  });

  // If register succeeded and returned token or user, try login
  console.log('\n[TEST] Attempt login for newly registered if created');
  await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: mail, password: 'Testpass123' })
  });

  // Try /users/me after admin login if admin login worked
  console.log('\n[TEST] If admin login produced token, try /users/me (manual step)');

  console.log('\n[TEST] Done');
})();
