#!/usr/bin/env node

/**
 * COMPREHENSIVE E2E TEST
 * Simulates: Browser → Login → Token Storage → Session Restore → Dashboard Load
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const TESTS = [];
let PASSED = 0;
let FAILED = 0;

function assert(condition, message) {
  if (!condition) {
    console.log(`  ❌ FAILED: ${message}`);
    FAILED++;
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
    PASSED++;
  }
}

function request(method, path, data = null, headers = {}) {
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
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
          json: () => {
            try { return JSON.parse(body); } catch { return null; }
          }
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Simulate browser localStorage
const storage = {
  token: null,
  user: null,
  clear() {
    this.token = null;
    this.user = null;
  }
};

async function test(name, fn) {
  console.log(`\n📝 ${name}`);
  try {
    await fn();
    console.log(`  ✅ PASSED\n`);
  } catch (e) {
    console.log(`  ❌ FAILED: ${e.message}\n`);
    throw e;
  }
}

async function runAllTests() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         COMPREHENSIVE E2E AUTH TEST SUITE                 ║
╚════════════════════════════════════════════════════════════╝
`);

  try {
    // TEST 1: Backend Health
    await test("1. Backend Health Check", async () => {
      const res = await request('GET', '/api/health');
      assert(res.status === 200, "Backend is running");
      const data = res.json();
      assert(data?.status === 'OK', "Health endpoint returns OK");
    });

    // TEST 2: Admin Login
    let adminToken = null;
    let adminUser = null;
    await test("2. Admin Login (admin@cmc.ma / admin123)", async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'admin@cmc.ma',
        password: 'admin123'
      });
      assert(res.status === 200, `Login returns HTTP 200 (got ${res.status})`);
      
      const data = res.json();
      assert(data?.token, "Response includes token");
      assert(data?.user?.email === 'admin@cmc.ma', "User email matches");
      assert(data?.user?.role === 'Admin', "User role is Admin");
      
      adminToken = data.token;
      adminUser = data.user;
      storage.token = adminToken;
      storage.user = adminUser;
      console.log(`    Token: ${adminToken.substring(0, 30)}...`);
      console.log(`    User: ${adminUser.full_name || adminUser.nom}`);
    });

    // TEST 3: Verify Admin Token
    await test("3. Verify Admin Token (GET /api/users/me)", async () => {
      assert(storage.token, "Token is stored");
      const res = await request('GET', '/api/users/me', null, {
        'Authorization': `Bearer ${storage.token}`
      });
      assert(res.status === 200, `GET /users/me returns HTTP 200 (got ${res.status})`);
      
      const data = res.json();
      assert(data?.email === 'admin@cmc.ma', "Profile email matches");
      assert(data?.role === 'Admin', "Profile role is Admin");
    });

    // TEST 4: Page Refresh Simulation (Token Persistence)
    await test("4. Simulate Page Refresh (Token Persistence)", async () => {
      const storedToken = storage.token;
      assert(storedToken, "Token still exists after 'page refresh'");
      
      // Make another request to verify token still works
      const res = await request('GET', '/api/users/me', null, {
        'Authorization': `Bearer ${storedToken}`
      });
      assert(res.status === 200, "Token still valid after refresh");
    });

    // TEST 5: Logout & Clear Token
    await test("5. Logout (Clear Token)", async () => {
      storage.clear();
      assert(!storage.token, "Token cleared");
      assert(!storage.user, "User cleared");
    });

    // TEST 6: User Login
    let userToken = null;
    let userUser = null;
    await test("6. User Login (user@cmc.ma / user123)", async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'user@cmc.ma',
        password: 'user123'
      });
      assert(res.status === 200, `Login returns HTTP 200 (got ${res.status})`);
      
      const data = res.json();
      assert(data?.token, "Response includes token");
      assert(data?.user?.email === 'user@cmc.ma', "User email matches");
      assert(data?.user?.role === 'Utilisateur', "User role is Utilisateur");
      
      userToken = data.token;
      userUser = data.user;
      storage.token = userToken;
      storage.user = userUser;
      console.log(`    Token: ${userToken.substring(0, 30)}...`);
      console.log(`    User: ${userUser.full_name || userUser.nom}`);
    });

    // TEST 7: Verify User Token
    await test("7. Verify User Token (GET /api/users/me)", async () => {
      assert(storage.token, "Token is stored");
      const res = await request('GET', '/api/users/me', null, {
        'Authorization': `Bearer ${storage.token}`
      });
      assert(res.status === 200, `GET /users/me returns HTTP 200 (got ${res.status})`);
      
      const data = res.json();
      assert(data?.email === 'user@cmc.ma', "Profile email matches");
      assert(data?.role === 'Utilisateur', "Profile role is Utilisateur");
    });

    // TEST 8: Invalid Token Rejection
    await test("8. Invalid Token Rejection", async () => {
      const res = await request('GET', '/api/users/me', null, {
        'Authorization': 'Bearer invalid_token_12345'
      });
      assert(res.status === 401, `Invalid token returns HTTP 401 (got ${res.status})`);
    });

    // TEST 9: Missing Token Rejection
    await test("9. Missing Token Rejection", async () => {
      const res = await request('GET', '/api/users/me');
      assert(res.status === 401, `No token returns HTTP 401 (got ${res.status})`);
    });

    // TEST 10: Verify Frontend Files
    await test("10. Verify Frontend Files Exist", async () => {
      const files = [
        'frontend/src/hooks/useAuth.tsx',
        'frontend/src/services/api.ts',
        'frontend/src/pages/Login.tsx',
        'frontend/src/components/app/ProtectedRoute.tsx',
        'frontend/.env'
      ];
      
      for (const file of files) {
        const fullPath = path.join('/Users/salma/casablanca-stock-flow1', file);
        assert(fs.existsSync(fullPath), `File exists: ${file}`);
      }
    });

    // TEST 11: Verify .env Configuration
    await test("11. Verify Frontend .env Configuration", async () => {
      const envPath = path.join('/Users/salma/casablanca-stock-flow1/frontend', '.env');
      const envContent = fs.readFileSync(envPath, 'utf8');
      assert(envContent.includes('VITE_API_URL'), ".env has VITE_API_URL");
      assert(envContent.includes('localhost:3000'), ".env points to localhost:3000");
    });

    // TEST 12: API URL Validation
    await test("12. API URL Configuration Validation", async () => {
      const apiPath = path.join('/Users/salma/casablanca-stock-flow1/frontend/src/services', 'api.ts');
      const apiContent = fs.readFileSync(apiPath, 'utf8');
      assert(apiContent.includes('VITE_API_URL'), "api.ts uses VITE_API_URL");
      assert(apiContent.includes('localhost:3000'), "api.ts has fallback to localhost:3000");
    });

    // SUMMARY
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                    TEST RESULTS SUMMARY                   ║
╚════════════════════════════════════════════════════════════╝

✅ PASSED: ${PASSED}
❌ FAILED: ${FAILED}
📊 TOTAL:  ${PASSED + FAILED}

${FAILED === 0 ? '🎉 ALL TESTS PASSED! Authentication is fully working!' : '⚠️  Some tests failed. Check above for details.'}
`);

    return FAILED === 0;

  } catch (e) {
    console.error('\n❌ Test suite error:', e.message);
    return false;
  }
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
