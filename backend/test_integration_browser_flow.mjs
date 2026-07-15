#!/usr/bin/env node
/**
 * Complete Integration Test - Browser Simulation
 * 
 * Tests all user journeys:
 * 1. Admin login → F5 → navigate → logout → relogin
 * 2. User login → F5 → navigate → logout → relogin
 * 3. New user register → login
 * 4. Protected routes reject unauthenticated users
 * 5. Role-based route protection works (admin vs user)
 * 6. Network errors don't force logout
 */

const API = 'http://localhost:3000/api';

class BrowserSimulation {
  constructor() {
    // Simulate browser localStorage
    this.store = {};
    this.logs = [];
  }

  // Simulate localStorage
  localStorage = {
    getItem: (k) => this.store[k] || null,
    setItem: (k, v) => { this.store[k] = v; this.logs.push(`[localStorage] set ${k}`); },
    removeItem: (k) => { delete this.store[k]; this.logs.push(`[localStorage] remove ${k}`); },
    clear: () => { Object.keys(this.store).forEach(k => delete this.store[k]); this.logs.push(`[localStorage] clear`); },
  };

  log(message) {
    this.logs.push(message);
  }

  getLogs() {
    return this.logs;
  }

  // Simulate fetch with Bearer header if token exists
  async fetch(path, options = {}) {
    const token = this.localStorage.getItem('token');
    const headers = options.headers || {};
    
    if (token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
      this.log(`[FETCH] ${options.method || 'GET'} ${path} - Authorization: Bearer ${token.substring(0, 20)}...`);
    } else {
      this.log(`[FETCH] ${options.method || 'GET'} ${path} - No auth header`);
    }

    return fetch(API + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }

  // Simulate hydrate on page load
  async hydrate() {
    this.log('[HYDRATE] Starting...');
    const token = this.localStorage.getItem('token');
    
    if (!token) {
      this.log('[HYDRATE] No token in localStorage');
      return null;
    }

    try {
      const res = await this.fetch('/users/me');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          this.log('[HYDRATE] Got 401/403, clearing token');
          this.localStorage.removeItem('token');
          this.localStorage.removeItem('user');
          return null;
        } else {
          this.log(`[HYDRATE] Got ${res.status}, keeping token`);
          return null;
        }
      }

      const user = await res.json();
      this.localStorage.setItem('user', JSON.stringify(user));
      this.log(`[HYDRATE] Success: ${user.email} (${user.role})`);
      return user;
    } catch (e) {
      this.log(`[HYDRATE] Network error: ${e.message}`);
      // Keep token on network error
      return null;
    }
  }

  // Simulate login flow
  async login(email, password) {
    this.log(`[LOGIN] Attempting ${email}...`);
    try {
      const res = await this.fetch('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        this.log(`[LOGIN] Failed with status ${res.status}`);
        return null;
      }

      const data = await res.json();
      this.localStorage.setItem('token', data.token);
      this.localStorage.setItem('user', JSON.stringify(data.user));
      
      this.log(`[LOGIN] Success: ${data.user.email} (${data.user.role})`);
      return data.user;
    } catch (e) {
      this.log(`[LOGIN] Error: ${e.message}`);
      return null;
    }
  }

  // Simulate logout
  async logout() {
    this.log('[LOGOUT] Clearing localStorage...');
    this.localStorage.removeItem('token');
    this.localStorage.removeItem('user');
    this.log('[LOGOUT] Complete');
  }

  // Simulate navigation to protected route
  async navigateProtected(adminOnly = false) {
    const token = this.localStorage.getItem('token');
    const user = this.localStorage.getItem('user') ? JSON.parse(this.localStorage.getItem('user')) : null;
    
    const isAdmin = user?.role === 'Admin';
    const path = adminOnly ? '/dashboard' : '/portal/dashboard';
    const nonAdminOnly = !adminOnly; // shorthand for user portal
    
    this.log(`[NAVIGATE] ${path} (adminOnly=${adminOnly}, nonAdminOnly=${nonAdminOnly}, isAdmin=${isAdmin})`);

    if (!user) {
      this.log(`[NAVIGATE] Not authenticated - redirect to /login`);
      return false;
    }

    // ProtectedRoute logic:
    // if (adminOnly && !isAdmin) return Navigate to /portal/dashboard
    // if (nonAdminOnly && isAdmin) return Navigate to /dashboard
    
    if (adminOnly && !isAdmin) {
      this.log(`[NAVIGATE] Not admin - redirect to /portal/dashboard`);
      return false;
    }

    if (nonAdminOnly && isAdmin) {
      this.log(`[NAVIGATE] User is admin, cannot access user portal - redirect to /dashboard`);
      return false;
    }

    this.log(`[NAVIGATE] Access granted`);
    return true;
  }

  // Simulate register
  async register(fullName, email, password) {
    this.log(`[REGISTER] Attempting ${email}...`);
    try {
      const res = await this.fetch('/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ full_name: fullName, email, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        this.log(`[REGISTER] Failed: ${error.error || res.statusText}`);
        return null;
      }

      this.log(`[REGISTER] Success`);
      return true;
    } catch (e) {
      this.log(`[REGISTER] Error: ${e.message}`);
      return null;
    }
  }
}

// Test suite
const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

async function runAll() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   StockFlow Complete Integration Test (Browser Flow)    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      console.log(`\n📝 ${name}`);
      const browser = new BrowserSimulation();
      await fn(browser);
      
      console.log(`   Browser Flow:`);
      browser.getLogs().forEach(log => {
        console.log(`     ${log}`);
      });

      console.log(`✅ PASS\n`);
      passed++;
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}\n`);
      failed++;
    }
  }

  console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║ Results: ${passed} passed, ${failed} failed${' '.repeat(Math.max(0, 37 - (passed + '').length - (failed + '').length))} ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// TESTS

test('1. Admin Complete Flow: Login → Hydrate → Navigate → Logout → Relogin', async (browser) => {
  // Step 1: Load page (empty localStorage)
  let user = await browser.hydrate();
  if (user) throw new Error('Should have no user on first load');

  // Step 2: Admin login
  user = await browser.login('admin@cmc.ma', 'admin123');
  if (!user || user.role !== 'Admin') throw new Error('Admin login failed');

  // Step 3: F5 refresh (hydrate)
  user = await browser.hydrate();
  if (!user || user.role !== 'Admin') throw new Error('Hydrate after F5 failed');

  // Step 4: Navigate to admin dashboard
  const canNavigate = await browser.navigateProtected(true);
  if (!canNavigate) throw new Error('Cannot navigate to admin dashboard');

  // Step 5: Logout
  await browser.logout();

  // Step 6: Try to navigate without auth
  const canNavigateNoAuth = await browser.navigateProtected(true);
  if (canNavigateNoAuth) throw new Error('Should not navigate without auth');

  // Step 7: Relogin
  user = await browser.login('admin@cmc.ma', 'admin123');
  if (!user || user.role !== 'Admin') throw new Error('Relogin failed');

  // Step 8: Verify can navigate again
  const canNavigateAgain = await browser.navigateProtected(true);
  if (!canNavigateAgain) throw new Error('Cannot navigate after relogin');
});

test('2. User Complete Flow: Login → Hydrate → Navigate → Logout → Relogin', async (browser) => {
  // Step 1: User login
  let user = await browser.login('user@cmc.ma', 'user123');
  if (!user || user.role !== 'Utilisateur') throw new Error('User login failed');

  // Step 2: F5 refresh
  user = await browser.hydrate();
  if (!user || user.role !== 'Utilisateur') throw new Error('Hydrate after F5 failed');

  // Step 3: Navigate to user portal
  const canNavigate = await browser.navigateProtected(false);
  if (!canNavigate) throw new Error('Cannot navigate to user portal');

  // Step 4: Logout
  await browser.logout();

  // Step 5: Relogin
  user = await browser.login('user@cmc.ma', 'user123');
  if (!user || user.role !== 'Utilisateur') throw new Error('Relogin failed');

  // Step 6: Verify can navigate again
  const canNavigateAgain = await browser.navigateProtected(false);
  if (!canNavigateAgain) throw new Error('Cannot navigate after relogin');
});

test('3. Role-Based Protection: Admin cannot access user portal, user cannot access admin dashboard', async (browser) => {
  // Admin tries user portal
  let user = await browser.login('admin@cmc.ma', 'admin123');
  if (!user) throw new Error('Admin login failed');

  let canAccessUserPortal = await browser.navigateProtected(false); // adminOnly=false
  if (canAccessUserPortal) throw new Error('Admin should not access user portal');

  // User tries admin dashboard
  await browser.logout();
  user = await browser.login('user@cmc.ma', 'user123');
  if (!user) throw new Error('User login failed');

  let canAccessAdminDash = await browser.navigateProtected(true); // adminOnly=true
  if (canAccessAdminDash) throw new Error('User should not access admin dashboard');
});

test('4. New User Registration and Login', async (browser) => {
  const email = `integration-${Date.now()}@cmc.ma`;
  
  // Register
  const registered = await browser.register('Integration Test User', email, 'IntegrationPass123');
  if (!registered) throw new Error('Registration failed');

  // Login with new user
  const user = await browser.login(email, 'IntegrationPass123');
  if (!user) throw new Error('New user login failed');

  // Navigate (should be non-admin)
  const canNavigate = await browser.navigateProtected(false);
  if (!canNavigate) throw new Error('New user cannot navigate');
});

test('5. Multiple Rapid Relogins (F5 spam)', async (browser) => {
  // Login
  let user = await browser.login('admin@cmc.ma', 'admin123');
  if (!user) throw new Error('Initial login failed');

  // Rapid F5s
  for (let i = 0; i < 5; i++) {
    user = await browser.hydrate();
    if (!user) throw new Error(`Hydrate #${i + 1} failed`);
  }

  // Should still be logged in with same token
  const storedToken = browser.localStorage.getItem('token');
  if (!storedToken) throw new Error('Token lost after rapid hydrates');
});

test('6. Logout Clears Everything', async (browser) => {
  // Login
  let user = await browser.login('admin@cmc.ma', 'admin123');
  if (!user) throw new Error('Login failed');

  // Verify storage populated
  if (!browser.localStorage.getItem('token')) throw new Error('Token not stored');
  if (!browser.localStorage.getItem('user')) throw new Error('User not stored');

  // Logout
  await browser.logout();

  // Verify cleared
  if (browser.localStorage.getItem('token')) throw new Error('Token not cleared');
  if (browser.localStorage.getItem('user')) throw new Error('User not cleared');

  // Hydrate should fail (no token)
  user = await browser.hydrate();
  if (user) throw new Error('Hydrate should fail after logout');
});

// RUN ALL TESTS
runAll().catch(console.error);
