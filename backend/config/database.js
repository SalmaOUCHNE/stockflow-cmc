import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  database: process.env.DB_NAME || 'stockflow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : '',
});

pool.on('error', (err) => {
  console.error('Erreur PostgreSQL:', err);
});

export default pool;
