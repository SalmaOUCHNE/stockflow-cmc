import pool from '../config/database.js';

const dashboardService = {
  async getDashboardData() {

    const items = await pool.query(`
      SELECT id, libelle, stock_actuel, seuil_alerte
      FROM products
    `);

    const movements = await pool.query(`
      SELECT *
      FROM stock_movements
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const users = await pool.query(`
      SELECT COUNT(*) as total
      FROM users
    `);

    return {
      items: items.rows,
      movements: movements.rows,
      totalUsers: users.rows[0].total
    };
  }
};

export default dashboardService;