const http = require('http');

function test(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('=== TEST 1: Admin Login ===');
  try {
    const res1 = await test('POST', '/api/auth/login', {
      email: 'admin@cmc.ma',
      password: 'admin123'
    });
    console.log('Status:', res1.status);
    console.log('Response:', res1.body);
    console.log('');
    
    const adminToken = res1.status === 200 ? JSON.parse(res1.body).token : null;
    
    if (adminToken) {
      console.log('=== TEST 2: GET /api/users/me (Admin) ===');
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/users/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          console.log('Status:', res.statusCode);
          console.log('Response:', body);
          console.log('');
          
          console.log('=== TEST 3: User Login ===');
          test('POST', '/api/auth/login', {
            email: 'user@cmc.ma',
            password: 'user123'
          }).then(res3 => {
            console.log('Status:', res3.status);
            console.log('Response:', res3.body);
            process.exit(0);
          });
        });
      });
      req.on('error', console.error);
      req.end();
    } else {
      process.exit(1);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

runTests();
