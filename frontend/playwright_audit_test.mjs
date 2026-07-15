import { chromium } from 'playwright';
import fs from 'fs';

const API = 'http://127.0.0.1:3000/api';
const APP = 'http://127.0.0.1:4173';

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function testPages(token, user, pages, label) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const errors = [];
  const warnings = [];
  const logs = [];
  const page = await context.newPage();
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    logs.push({ type, text });
    if (type === 'error') errors.push(text);
    if (type === 'warning') warnings.push(text);
  });
  await page.addInitScript((t,u)=>{
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, token, user);
  const results = [];
  for (const path of pages) {
    const target = `${APP}${path}`;
    try {
      const response = await page.goto(target, { waitUntil: 'networkidle', timeout: 45000 });
      const status = response?.status();
      await page.waitForTimeout(1500);
      const title = await page.title();
      const headings = await page.$$eval('h1,h2,h3', els => els.map(el => el.textContent?.trim()).filter(Boolean));
      results.push({ path, status, title, headings });
    } catch (err) {
      results.push({ path, status: 'error', error: err.message });
    }
  }
  await browser.close();
  return { label, results, errors, warnings, logs };
}

(async () => {
  const out = [];
  const admin = await login('admin@cmc.ma', 'AdminPass123!');
  out.push({ login: 'admin@cmc.ma', response: admin });
  const user = await login('user@cmc.ma', 'user123');
  out.push({ login: 'user@cmc.ma', response: user });

  if (admin.status === 200) {
    const pages = ['/dashboard','/stock','/entries','/exits','/bons','/inventory','/audit','/expirations','/reports','/users'];
    const adminResult = await testPages(admin.data.token, admin.data.user, pages, 'admin');
    out.push(adminResult);
    try {
      const productsRes = await fetch(`${API}/stock/products`, { headers: { Authorization: `Bearer ${admin.data.token}` } });
      const products = await productsRes.json();
      const firstId = products?.[0]?.id || products?.[0]?.uuid || null;
      if (firstId) {
        const detailResult = await testPages(admin.data.token, admin.data.user, [`/stock/${firstId}`], 'admin-item-detail');
        out.push(detailResult);
      } else {
        out.push({ label: 'admin-item-detail', error: 'no product id found' });
      }
    } catch (err) {
      out.push({ label: 'admin-item-detail', error: String(err) });
    }
  }

  if (user.status === 200) {
    const userPages = ['/portal/dashboard','/portal/catalogue','/portal/nouvelle-demande','/portal/mes-demandes','/portal/historique','/portal/notifications','/portal/profil'];
    const userResult = await testPages(user.data.token, user.data.user, userPages, 'user');
    out.push(userResult);
  }

  fs.writeFileSync('./playwright_audit_report.json', JSON.stringify(out, null, 2));
  console.log('Audit completed.');
})();
