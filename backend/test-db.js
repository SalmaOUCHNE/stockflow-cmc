import dotenv from 'dotenv';
import pool from './config/database.js';

dotenv.config();

try {
  const result = await pool.query('SELECT NOW()');
  console.log('✅ PostgreSQL connecté');
  console.log(result.rows);
} catch (err) {
  console.error('❌ Erreur PostgreSQL');
  console.error(err);
}