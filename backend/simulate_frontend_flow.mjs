const API = 'http://localhost:3000/api';
// using global fetch available in Node 18+


const localStorage = {};
const sessionStorage = {};

async function post(path, body){
  const res = await fetch(API+path, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const txt = await res.text();
  let json; try{ json = JSON.parse(txt); }catch(e){ json = txt; }
  return { status: res.status, body: json };
}

async function getWithToken(path){
  const token = localStorage['token'];
  const res = await fetch(API+path, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
  const txt = await res.text();
  let json; try{ json = JSON.parse(txt); }catch(e){ json = txt; }
  return { status: res.status, body: json };
}

async function run(){
  console.log('\n--- LOGIN admin (1) ---');
  let r = await post('/auth/login', { email: 'admin@cmc.ma', password: 'admin123' });
  console.log('HTTP', r.status);
  console.log(JSON.stringify(r.body, null, 2));
  if(r.body && r.body.token){
    localStorage['token'] = r.body.token;
    localStorage['user'] = JSON.stringify(r.body.user);
  }
  console.log('\nlocalStorage after login:', JSON.stringify(localStorage, null, 2));
  console.log('sessionStorage:', JSON.stringify(sessionStorage, null, 2));

  console.log('\n--- AuthProvider.hydrate (simulate) ---');
  let me = await getWithToken('/users/me');
  console.log('GET /users/me', me.status);
  console.log(JSON.stringify(me.body, null, 2));
  const roles = me.body?.role ? [me.body.role.toString().toLowerCase()] : [];
  console.log('derived roles:', roles);

  console.log('\n--- ProtectedRoute decision (adminOnly = true) ---');
  const user = me.body ? me.body : null;
  const loading = false;
  if(loading) console.log('ProtectedRoute: loading -> spinner');
  else if(!user) console.log('ProtectedRoute: redirect to /login');
  else if(true && !roles.some(r=>r==='admin')) console.log('ProtectedRoute: redirect to /portal/dashboard');
  else console.log('ProtectedRoute: allow');

  console.log('\n--- LOGOUT ---');
  delete localStorage['token']; delete localStorage['user'];
  console.log('localStorage after logout:', JSON.stringify(localStorage, null, 2));
  console.log('sessionStorage after logout:', JSON.stringify(sessionStorage, null, 2));

  console.log('\n--- LOGIN admin (2) after logout ---');
  r = await post('/auth/login', { email: 'admin@cmc.ma', password: 'admin123' });
  console.log('HTTP', r.status);
  console.log(JSON.stringify(r.body, null, 2));
  if(r.body && r.body.token){
    localStorage['token'] = r.body.token;
    localStorage['user'] = JSON.stringify(r.body.user);
  }
  console.log('\nlocalStorage after login2:', JSON.stringify(localStorage, null, 2));

  console.log('\n--- REGISTER new user ---');
  const email = 'sim+'+Date.now()+'@cmc.ma';
  const reg = await post('/auth/register', { full_name: 'Sim User', email, password: 'SimPass123' });
  console.log('HTTP', reg.status);
  console.log(JSON.stringify(reg.body, null, 2));

  console.log('\n--- Attempt login for newly registered ---');
  const r2 = await post('/auth/login', { email, password: 'SimPass123' });
  console.log('HTTP', r2.status);
  console.log(JSON.stringify(r2.body, null, 2));
}

run().catch(e=>{ console.error(e && (e.stack||e.message||e)); process.exit(1); });
