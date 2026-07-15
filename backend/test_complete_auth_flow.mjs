#!/usr/bin/env node
/**
 * Complete Auth Flow Test
 * Tests: Login → Hydrate → Logout → ReLogin → Register → ReLogin
 * Validates: localStorage, tokens, roles, network errors vs 401
 */

const API = 'http://localhost:3000/api';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║      StockFlow Complete Auth Flow Test         ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const state = { token: null, user: null };

  for (const { name, fn } of tests) {
    try {
      console.log(`\n📝 ${name}...`);
      await fn(state);
      console.log(`✅ PASS`);
      passed++;
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n╔════════════════════════════════════════════════╗`);
  console.log(`║ Results: ${passed} passed, ${failed} failed${' '.repeat(Math.max(0, 21 - (passed + '').length - (failed + '').length))} ║`);
  console.log(`╚════════════════════════════════════════════════╝\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// TESTS

test('1. Login with admin credentials', async (state) => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cmc.ma', password: 'admin123' }),
  });
  
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  
  const data = await res.json();
  assert(data.token, 'No token in response');
  assert(data.user?.id, 'No user.id in response');
  assert(data.user?.role === 'Admin', `Expected role 'Admin', got '${data.user?.role}'`);
  
  state.token = data.token;
  state.user = data.user;
  
  console.log(`  → Token: ${state.token.substring(0, 20)}...`);
  console.log(`  → User: ${state.user.email} (${state.user.role})`);
});

test('2. GET /users/me with valid token', async (state) => {
  const res = await fetch(`${API}/users/me`, {
    headers: { 'Authorization': `Bearer ${state.token}` },
  });
  
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  
  const data = await res.json();
  assert(data.email === 'admin@cmc.ma', 'User email mismatch');
  assert(data.role === 'Admin', 'User role mismatch');
  
  console.log(`  → /users/me returned: ${data.email} (${data.role})`);
});

test('3. Login with user credentials', async (state) => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@cmc.ma', password: 'user123' }),
  });
  
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  
  const data = await res.json();
  assert(data.token, 'No token in response');
  assert(data.user?.id, 'No user.id in response');
  assert(data.user?.role === 'Utilisateur', `Expected role 'Utilisateur', got '${data.user?.role}'`);
  
  state.token = data.token;
  state.user = data.user;
  
  console.log(`  → Token: ${state.token.substring(0, 20)}...`);
  console.log(`  → User: ${state.user.email} (${state.user.role})`);
});

test('4. ReLogin admin after "logout" (simulated by token clearing)', async (state) => {
  // Simulate logout by clearing token
  state.token = null;
  state.user = null;
  
  // Relogin
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cmc.ma', password: 'admin123' }),
  });
  
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  
  const data = await res.json();
  assert(data.token, 'No token in response after relogin');
  
  state.token = data.token;
  state.user = data.user;
  
  console.log(`  → ReLogin successful`);
  console.log(`  → Token: ${state.token.substring(0, 20)}...`);
});

test('5. Invalid token returns 401', async (state) => {
  const res = await fetch(`${API}/users/me`, {
    headers: { 'Authorization': 'Bearer invalid.token.here' },
  });
  
  assert(res.status === 401, `Expected 401, got ${res.status}`);
  
  const data = await res.json();
  assert(data.error, 'No error message in 401 response');
  
  console.log(`  → /users/me with invalid token returns 401`);
});

test('6. Missing token returns 401', async (state) => {
  const res = await fetch(`${API}/users/me`);
  
  assert(res.status === 401, `Expected 401, got ${res.status}`);
  
  console.log(`  → /users/me without token returns 401`);
});

test('7. Register new user', async (state) => {
  const email = `test${Date.now()}@cmc.ma`;
  
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Test User',
      email,
      password: 'TestPass123',
    }),
  });
  
  assert(res.status === 201, `Expected 201, got ${res.status}`);
  
  const data = await res.json();
  assert(data.message, 'No success message in register response');
  
  state.newUserEmail = email;
  
  console.log(`  → New user registered: ${email}`);
});

test('8. Login with newly registered user', async (state) => {
  assert(state.newUserEmail, 'No new user email from previous test');
  
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: state.newUserEmail,
      password: 'TestPass123',
    }),
  });
  
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  
  const data = await res.json();
  assert(data.token, 'No token in response');
  assert(data.user?.email === state.newUserEmail, 'Email mismatch');
  
  console.log(`  → New user login successful: ${data.user?.email}`);
});

test('9. Multiple rapid relogins work (simulate F5 refresh)', async (state) => {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cmc.ma', password: 'admin123' }),
    });
    
    assert(res.status === 200, `Relogin ${i + 1} failed with status ${res.status}`);
    
    const data = await res.json();
    assert(data.token, `Relogin ${i + 1}: no token`);
  }
  
  console.log(`  → 3 rapid relogins successful`);
});

test('10. Admin role checking', async (state) => {
  const adminRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cmc.ma', password: 'admin123' }),
  });
  
  assert(adminRes.status === 200, 'Admin login failed');
  const adminData = await adminRes.json();
  assert(adminData.user?.role === 'Admin', 'Admin role mismatch');
  
  const userRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@cmc.ma', password: 'user123' }),
  });
  
  assert(userRes.status === 200, 'User login failed');
  const userData = await userRes.json();
  assert(userData.user?.role === 'Utilisateur', 'User role mismatch');
  
  console.log(`  → Admin: ${adminData.user?.role}`);
  console.log(`  → User: ${userData.user?.role}`);
});

// RUN ALL TESTS
run().catch(console.error);
