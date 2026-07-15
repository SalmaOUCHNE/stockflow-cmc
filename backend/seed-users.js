import bcrypt from 'bcrypt';
import pool from './config/database.js';
import dotenv from 'dotenv';
dotenv.config();

const ensureUser = async ({ email, password, nom = null, prenom = null, role_id = 'Utilisateur' }) => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (res.rows.length > 0) {
      console.log(`User ${email} already exists`);
      return;
    }
    const hash = await bcrypt.hash(password, 12);
    const insert = await client.query(
      `INSERT INTO users (nom, prenom, email, password_hash, role_id, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,true,NOW()) RETURNING id`,
      [nom, prenom, email, hash, role_id]
    );
    console.log(`Created user ${email} with id ${insert.rows[0].id}`);
  } catch (err) {
    console.error('Seed error', err);
  } finally {
    client.release();
  }
};

const run = async () => {
  // Ensure default roles exist in the DB (script schema.sql should have inserted them).
  // Use role names expected by the users table (nom in roles table).
  const adminRoleName = 'Admin';

  await ensureUser({ email: 'admin@cmc.ma', password: 'admin123', nom: 'Admin', prenom: 'CMC', role_id: adminRoleName });
  await ensureUser({ email: 'user@cmc.ma', password: 'user123', nom: 'User', prenom: 'CMC' });
  process.exit(0);
};

run();
