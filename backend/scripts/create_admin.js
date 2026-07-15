import pool from '../config/database.js';
import bcrypt from 'bcrypt';

const run = async () => {
  try {
    const email = 'ci-admin@example.com';
    const password = 'AdminSecret123!';
    const nom = 'CIAdmin';
    const prenom = 'CI';

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('Admin already exists:', email);
      process.exit(0);
    }

    const hash = await bcrypt.hash(password, 10);
    const res = await pool.query(
      `INSERT INTO users (nom, prenom, email, password_hash, role_id, status, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,'active', true, NOW()) RETURNING id`,
      [nom, prenom, email, hash, 'Admin']
    );

    console.log('Created admin user:', email, 'id:', res.rows[0].id, 'password:', password);
    process.exit(0);
  } catch (e) {
    console.error('Error creating admin:', e);
    process.exit(1);
  }
};

run();