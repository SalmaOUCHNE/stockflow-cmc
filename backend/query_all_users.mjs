import pool from './config/database.js';

try {
  console.log('[TEMP QUERY ALL] Starting full users SELECT');
  const res = await pool.query('SELECT email, password_hash, role_id, is_active FROM users ORDER BY email');
  console.log('[TEMP QUERY ALL] ROWS_START');
  console.log(JSON.stringify(res.rows, null, 2));
  console.log('[TEMP QUERY ALL] ROWS_END');
} catch (err) {
  console.error('[TEMP QUERY ALL] ERROR', err && (err.stack || err.message || err));
} finally {
  try { await pool.end(); } catch (e) { }
}
