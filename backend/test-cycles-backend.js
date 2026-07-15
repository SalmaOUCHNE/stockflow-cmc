const http = require('http');
const { Client } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || 'stockflow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Admin'
};

async function queryDB() {
  const client = new Client(dbConfig);
  await client.connect();
  const res = await client.query('SELECT id, email, role_id, password_hash FROM users ORDER BY email');
  await client.end();
  return res.rows;
}

function request(method, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', (e) => reject(e));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  try {
    console.log('\n-- Initial DB users --');
    const before = await queryDB();
    console.table(before.map(u => ({email: u.email, role_id: String(u.role_id), password_hash: u.password_hash ? u.password_hash.slice(0,20) + '...' : null})));

    // Cycle 1: Login admin
    console.log('\n-- Cycle 1: Login admin@cmc.ma --');
    const r1 = await request('POST', '/api/auth/login', { email: 'admin@cmc.ma', password: 'admin123' });
    console.log('Login status:', r1.status);
    console.log('Body:', r1.body);
    const token1 = r1.status === 200 ? JSON.parse(r1.body).token : null;

    // Simulate logout (client-side): clear token (nothing to do server-side)
    console.log('\n-- Simulate logout (client-side) --');

    // Cycle 2: Login admin again
    console.log('\n-- Cycle 2: Login admin@cmc.ma again --');
    const r2 = await request('POST', '/api/auth/login', { email: 'admin@cmc.ma', password: 'admin123' });
    console.log('Login status:', r2.status);
    console.log('Body:', r2.body);

    // Cycle 3: Login user
    console.log('\n-- Cycle 3: Login user@cmc.ma --');
    const r3 = await request('POST', '/api/auth/login', { email: 'user@cmc.ma', password: 'user123' });
    console.log('Login status:', r3.status);
    console.log('Body:', r3.body);

    // Register test: create new user
    const newEmail = 'testuser+' + Date.now() + '@cmc.ma';
    console.log('\n-- Registering new user:', newEmail, '--');
    const reg = await request('POST', '/api/auth/register', { full_name: 'Test User', email: newEmail, password: 'testpass123' });
    console.log('Register status:', reg.status);
    console.log('Body:', reg.body);

    // Query DB after operations
    console.log('\n-- DB users after operations --');
    const after = await queryDB();
    console.table(after.map(u => ({email: u.email, role_id: String(u.role_id), password_hash: u.password_hash ? u.password_hash.slice(0,20) + '...' : null})));

    // Compare hashes
    const beforeMap = Object.fromEntries(before.map(u => [u.email, u.password_hash]));
    const afterMap = Object.fromEntries(after.map(u => [u.email, u.password_hash]));
    ['admin@cmc.ma','user@cmc.ma'].forEach(email => {
      const b = beforeMap[email];
      const a = afterMap[email];
      console.log(`\nPassword hash comparison for ${email}:`);
      if (!b) console.log('  Before: MISSING'); else console.log('  Before:', b ? b.slice(0,20)+'...' : null);
      if (!a) console.log('  After: MISSING'); else console.log('  After :', a ? a.slice(0,20)+'...' : null);
      console.log('  Same?:', b === a);
    });

    // Repeat login/logout/login cycle to reproduce
    console.log('\n-- Reproduction cycles: login->logout->login x3 --');
    for (let i=0;i<3;i++) {
      const rr = await request('POST', '/api/auth/login', { email: 'admin@cmc.ma', password: 'admin123' });
      console.log(`Cycle ${i+1} login status:`, rr.status);
      if (rr.status !== 200) console.log('  Body:', rr.body);
    }

    // Try login after register for new user
    console.log(`\n-- Try login with newly registered user ${newEmail} --`);
    const lr = await request('POST', '/api/auth/login', { email: newEmail, password: 'testpass123' });
    console.log('Login status:', lr.status);
    console.log('Body:', lr.body);

    console.log('\n-- Done --');
    process.exit(0);
  } catch (e) {
    console.error('Error in test script:', e);
    process.exit(1);
  }
})();
