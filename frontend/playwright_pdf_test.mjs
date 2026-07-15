import { chromium } from 'playwright';

const API = process.env.API_URL || 'http://localhost:3000/api';
const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:5174';

async function loginAsAdmin() {
  const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@stockflow.local', password: 'AdminPass123!' }) });
  if (!res.ok) throw new Error('Admin login failed: ' + res.status);
  const data = await res.json();
  const token = data.token;
  const meRes = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meRes.ok) throw new Error('/users/me failed');
  const user = await meRes.json();
  return { token, user };
}

(async () => {
  try {
    console.log('Logging in admin...');
    const { token, user } = await loginAsAdmin();
    console.log('Launching browser...');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set token and user before page loads
    await page.addInitScript((t, u) => {
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));
    }, token, user);

    const target = `${PREVIEW_URL}/exits`;
    console.log('Navigating to', target);
    await page.goto(target, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Clicking Télécharger...');
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 20000 }).catch(() => null),
      page.click('text=Télécharger').catch(() => null)
    ]);

    if (!download) {
      console.error('No download triggered; attempting to call print function fallback');
      // Try to call the downloadHtml function directly
      await page.evaluate(async () => {
        // @ts-ignore
        if (window && (window as any).downloadHtml) {
          // unlikely exposed; skip
        }
      });
      console.error('Download not captured. Exiting with failure.');
      await browser.close();
      process.exit(2);
    }

    const outPath = 'backend/bon_sortie_sample.pdf';
    await download.saveAs(outPath);
    console.log('Saved PDF to', outPath);
    const fs = await import('fs');
    const stat = fs.existsSync(outPath) ? fs.statSync(outPath) : null;
    console.log('PDF size:', stat ? stat.size : 'missing');

    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error('Playwright test failed', e && (e.stack || e.message || e));
    process.exit(1);
  }
})();
