import pool from '../config/database.js';

export async function getAll() {
  const q = `SELECT id, libelle as name, parent_category_id, description FROM categories ORDER BY libelle`;
  const { rows } = await pool.query(q);
  return rows;
}
