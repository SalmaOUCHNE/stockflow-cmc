import pool from './config/database.js';

const emails = ['admin@cmc.ma','user@cmc.ma'];

try {
  console.log('[TEMP QUERY] Starting users SELECT for', emails.join(', '));
  const res = await pool.query(
    'SELECT email, password_hash, role_id, is_active FROM users WHERE email = ANY($1)',
    [emails]
  );
  console.log('[TEMP QUERY] RESULT_ROWS_START');
  console.log(JSON.stringify(res.rows, null, 2));
  console.log('[TEMP QUERY] RESULT_ROWS_END');
} catch (err) {
  console.error('[TEMP QUERY] ERROR', err && (err.stack || err.message || err));
} finally {
  try { await pool.end(); } catch (e) { /* ignore */ }
}
