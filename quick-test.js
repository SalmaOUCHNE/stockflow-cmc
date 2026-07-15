const http = require('http');

function request(method, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {'Content-Type': 'application/json', ...headers}
    };
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({status: res.statusCode, body: body});
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  try {
    console.log('1. Admin Login...');
    const r1 = await request('POST', '/api/auth/login', {email: 'admin@cmc.ma', password: 'admin123'});
    console.log(`   Status: ${r1.status}`);
    if (r1.status !== 200) {
      console.log('   Error:', r1.body);
      process.exit(1);
    }
    const d1 = JSON.parse(r1.body);
    console.log(`   ✓ Token: ${d1.token.substring(0, 30)}...`);
    
    console.log('2. Verify token with GET /users/me...');
    const r2 = await request('GET', '/api/users/me', null, {Authorization: `Bearer ${d1.token}`});
    console.log(`   Status: ${r2.status}`);
    if (r2.status !== 200) {
      console.log('   Error:', r2.body);
      process.exit(1);
    }
    const d2 = JSON.parse(r2.body);
    console.log(`   ✓ User: ${d2.full_name}`);
    
    console.log('3. User Login...');
    const r3 = await request('POST', '/api/auth/login', {email: 'user@cmc.ma', password: 'user123'});
    console.log(`   Status: ${r3.status}`);
    if (r3.status !== 200) {
      console.log('   Error:', r3.body);
      process.exit(1);
    }
    const d3 = JSON.parse(r3.body);
    console.log(`   ✓ Token: ${d3.token.substring(0, 30)}...`);
    
    console.log('\n✅ ALL TESTS PASSED');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

run();
