import pool from '../config/database.js';

export async function getAll() {
  const q = `SELECT id, libelle as name, pole_id, responsable_id, created_at FROM filieres ORDER BY libelle`;
  const { rows } = await pool.query(q);
  return rows;
}

export async function getByPole(poleId) {
  const q = `SELECT id, libelle as name, pole_id, responsable_id, created_at FROM filieres WHERE pole_id = $1 ORDER BY libelle`;
  const { rows } = await pool.query(q, [poleId]);
  return rows;
}
