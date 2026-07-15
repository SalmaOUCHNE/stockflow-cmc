import pool from '../config/database.js';

export async function getAll() {
  const q = `SELECT id, nom as name, description, adresse, created_at FROM poles ORDER BY nom`;
  const { rows } = await pool.query(q);
  return rows;
}
