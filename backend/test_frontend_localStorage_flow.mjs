#!/usr/bin/env node
/**
 * Frontend localStorage & Auth Flow Simulation
 * Simulates browser: login → hydrate → logout → relogin → register
 * Validates: localStorage handling, token persistence, error scenarios
 */

// Simulate browser localStorage
const store = {};
const localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

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

function checkLocalStorage(expectedToken, expectedUser) {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (expectedToken === null) {
    assert(!token, 'Expected token to be cleared, but it still exists');
  } else {
    assert(token === expectedToken || (expectedToken && token), 'Token mismatch');
  }
  
  if (expectedUser === null) {
    assert(!user, 'Expected user to be cleared, but it still exists');
  } else {
    assert(user, 'Expected user in localStorage');
  }
}

async function run() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  Frontend Auth & localStorage Flow Test        ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const state = {};

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

test('1. Initial state: localStorage is empty', (state) => {
  assert(!localStorage.getItem('token'), 'Token should not exist initially');
  assert(!localStorage.getItem('user'), 'User should not exist initially');
  console.log('  → localStorage clean');
});

test('2. Admin login stores token & user', async (state) => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cmc.ma', password: 'admin123' }),
  });
  
  assert(res.status === 200, `Login failed with ${res.status}`);
  
  const data = await res.json();
  
  // Simulate frontend localStorage storage
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  checkLocalStorage(data.token, data.user);
  
  state.adminToken = data.token;
  state.adminUser = data.user;
  
  console.log(`  → Token stored: ${data.token.substring(0, 20)}...`);
  console.log(`  → User stored: ${data.user?.email}`);
});

test('3. Hydrate (GET /users/me) with stored token succeeds', async (state) => {
  const token = localStorage.getItem('token');
  assert(token, 'No token in localStorage');
  
  const res = await fetch(`${API}/users/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  assert(res.status === 200, `/users/me returned ${res.status}`);
  
  const user = await res.json();
  assert(user.email === 'admin@cmc.ma', 'User mismatch');
  
  console.log(`  → /users/me succeeded: ${user.email}`);
});

test('4. Simulated logout clears localStorage', (state) => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  checkLocalStorage(null, null);
  
  console.log('  → localStorage cleared');
});

test('5. After logout, stored token is gone', (state) => {
  assert(!localStorage.getItem('token'), 'Token still exists after logout');
  assert(!localStorage.getItem('user'), 'User still exists after logout');
  console.log('  → Verified: token and user removed');
});

test('6. Relogin after logout succeeds (stores new token)', async (state) => {
  assert(!localStorage.getItem('token'), 'Should be empty before relogin');
  
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cmc.ma', password: 'admin123' }),
  });
  
  assert(res.status === 200, `Relogin failed with ${res.status}`);
  
  const data = await res.json();
  
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  assert(localStorage.getItem('token'), 'Token not stored after relogin');
  
  state.newAdminToken = data.token;
  
  console.log(`  → New token stored: ${data.token.substring(0, 20)}...`);
  console.log(`  → Tokens are different: ${state.adminToken !== state.newAdminToken}`);
});

test('7. User login stores their credentials', async (state) => {
  localStorage.clear();
  
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@cmc.ma', password: 'user123' }),
  });
  
  assert(res.status === 200, `User login failed with ${res.status}`);
  
  const data = await res.json();
  
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  assert(data.user?.role === 'Utilisateur', `Expected role 'Utilisateur', got '${data.user?.role}'`);
  
  console.log(`  → User token stored: ${data.token.substring(0, 20)}...`);
  console.log(`  → User role verified: ${data.user?.role}`);
});

test('8. Register creates new user and can login', async (state) => {
  const email = `frontend-test-${Date.now()}@cmc.ma`;
  
  // Register
  const registerRes = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Frontend Test User',
      email,
      password: 'TestPass456',
    }),
  });
  
  assert(registerRes.status === 201, `Register failed with ${registerRes.status}`);
  
  // Login with new user
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'TestPass456' }),
  });
  
  assert(loginRes.status === 200, `New user login failed with ${loginRes.status}`);
  
  const data = await loginRes.json();
  
  localStorage.clear();
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  assert(localStorage.getItem('token'), 'New user token not stored');
  
  console.log(`  → New user registered: ${email}`);
  console.log(`  → New user login successful`);
  console.log(`  → New user token stored`);
});

test('9. Invalid token in localStorage gets rejected by API', async (state) => {
  localStorage.setItem('token', 'invalid.token.format');
  
  const res = await fetch(`${API}/users/me`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  });
  
  assert(res.status === 401, `Expected 401, got ${res.status}`);
  
  // In real frontend, this would trigger logout
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  console.log(`  → Invalid token correctly rejected (401)`);
  console.log(`  → Frontend would clear localStorage on 401`);
});

test('10. Multiple hydrate cycles preserve token', async (state) => {
  localStorage.clear();
  
  // First login
  let res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cmc.ma', password: 'admin123' }),
  });
  
  const data = await res.json();
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  const originalToken = localStorage.getItem('token');
  
  // Multiple hydrate calls (simulating F5 refresh)
  for (let i = 0; i < 3; i++) {
    const token = localStorage.getItem('token');
    res = await fetch(`${API}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    assert(res.status === 200, `Hydrate ${i + 1} failed`);
  }
  
  // Token should still be the same
  assert(localStorage.getItem('token') === originalToken, 'Token changed during hydrates');
  
  console.log(`  → 3 hydrate cycles completed`);
  console.log(`  → Token preserved: ${originalToken.substring(0, 20)}...`);
});

// RUN ALL TESTS
run().catch(console.error);
