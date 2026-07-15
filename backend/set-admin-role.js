import pool from './config/database.js';

async function run() {
  try {
    const res = await pool.query("UPDATE users SET role_id='Admin' WHERE email='admin@cmc.ma' RETURNING id, email, role_id");
    console.log('Updated rows:', res.rowCount);
    console.log(res.rows[0]);
  } catch (e) {
    console.error('Error updating admin role', e.message);
  } finally {
    process.exit(0);
  }
}

run();
