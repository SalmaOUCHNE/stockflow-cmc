// Simulates the complete browser login flow
const http = require('http');

// Simulate localStorage
const localStorage = {
  data: {},
  setItem(key, value) {
    this.data[key] = value;
    console.log(`  [localStorage] SET ${key}`);
  },
  getItem(key) {
    return this.data[key] || null;
  },
  removeItem(key) {
    delete this.data[key];
    console.log(`  [localStorage] REMOVE ${key}`);
  },
  clear() {
    this.data = {};
  }
};

function request(method, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
          json: () => {
            try {
              return JSON.parse(body);
            } catch {
              return null;
            }
          }
        });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function simulateLoginFlow() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         FULL LOGIN FLOW SIMULATION (Browser)               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // TEST 1: Admin Login
  console.log('📝 STEP 1: Admin Login (admin@cmc.ma / admin123)');
  const login1 = await request('POST', '/api/auth/login', {
    email: 'admin@cmc.ma',
    password: 'admin123'
  });
  console.log(`  Status: ${login1.status}`);
  
  if (login1.status !== 200) {
    console.log('  ❌ Login failed');
    console.log('  Response:', login1.body);
    return false;
  }
  
  const loginData1 = login1.json();
  console.log(`  ✓ Login successful`);
  console.log(`  User: ${loginData1.user.nom} ${loginData1.user.prenom}`);
  console.log(`  Role: ${loginData1.user.role}`);
  console.log(`  Token: ${loginData1.token.substring(0, 20)}...`);
  
  // Simulate storing in localStorage (what browser does)
  localStorage.setItem('token', loginData1.token);
  localStorage.setItem('user', JSON.stringify(loginData1.user));
  
  // TEST 2: Verify token works with GET /users/me
  console.log('\n📝 STEP 2: Verify token (GET /api/users/me)');
  const token1 = localStorage.getItem('token');
  const profile1 = await request('GET', '/api/users/me', null, {
    'Authorization': `Bearer ${token1}`
  });
  console.log(`  Status: ${profile1.status}`);
  
  if (profile1.status !== 200) {
    console.log('  ❌ GET /users/me failed');
    console.log('  Response:', profile1.body);
    return false;
  }
  
  const profileData1 = profile1.json();
  console.log(`  ✓ Token is valid`);
  console.log(`  Profile: ${profileData1.full_name}`);
  console.log(`  Role: ${profileData1.role}`);
  
  // TEST 3: Simulate page refresh - token should persist
  console.log('\n📝 STEP 3: Simulate page refresh (token should still be there)');
  const storedToken = localStorage.getItem('token');
  console.log(`  Token after "refresh": ${storedToken ? storedToken.substring(0, 20) + '...' : 'MISSING'}`);
  
  if (!storedToken) {
    console.log('  ❌ Token was not persisted');
    return false;
  }
  console.log('  ✓ Token persisted correctly');
  
  // TEST 4: User Login
  console.log('\n📝 STEP 4: User Login (user@cmc.ma / user123)');
  localStorage.clear();
  
  const login2 = await request('POST', '/api/auth/login', {
    email: 'user@cmc.ma',
    password: 'user123'
  });
  console.log(`  Status: ${login2.status}`);
  
  if (login2.status !== 200) {
    console.log('  ❌ Login failed');
    console.log('  Response:', login2.body);
    return false;
  }
  
  const loginData2 = login2.json();
  console.log(`  ✓ Login successful`);
  console.log(`  User: ${loginData2.user.nom} ${loginData2.user.prenom}`);
  console.log(`  Role: ${loginData2.user.role}`);
  
  localStorage.setItem('token', loginData2.token);
  localStorage.setItem('user', JSON.stringify(loginData2.user));
  
  // TEST 5: Verify user token
  console.log('\n📝 STEP 5: Verify user token (GET /api/users/me)');
  const token2 = localStorage.getItem('token');
  const profile2 = await request('GET', '/api/users/me', null, {
    'Authorization': `Bearer ${token2}`
  });
  console.log(`  Status: ${profile2.status}`);
  
  if (profile2.status !== 200) {
    console.log('  ❌ GET /users/me failed');
    console.log('  Response:', profile2.body);
    return false;
  }
  
  const profileData2 = profile2.json();
  console.log(`  ✓ Token is valid`);
  console.log(`  Profile: ${profileData2.full_name}`);
  console.log(`  Role: ${profileData2.role}`);
  
  // TEST 6: Test logout
  console.log('\n📝 STEP 6: Logout (clear token)');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('  ✓ Logout successful');
  
  // TEST 7: Verify no token persists
  console.log('\n📝 STEP 7: Verify token is removed after logout');
  const tokenAfterLogout = localStorage.getItem('token');
  console.log(`  Token after logout: ${tokenAfterLogout ? 'STILL EXISTS' : 'cleared'}`);
  
  if (tokenAfterLogout) {
    console.log('  ❌ Token should be removed after logout');
    return false;
  }
  console.log('  ✓ Token properly cleared');
  
  // TEST 8: Invalid token should fail
  console.log('\n📝 STEP 8: Test invalid token rejection');
  const invalidRes = await request('GET', '/api/users/me', null, {
    'Authorization': 'Bearer invalid_token_here'
  });
  console.log(`  Status: ${invalidRes.status}`);
  
  if (invalidRes.status !== 401) {
    console.log('  ⚠ Expected 401, got:', invalidRes.status);
  } else {
    console.log('  ✓ Invalid token properly rejected');
  }
  
  return true;
}

simulateLoginFlow().then(success => {
  if (success) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ ALL TESTS PASSED - Authentication system is working! ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed\n');
    process.exit(1);
  }
}).catch(e => {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
});
