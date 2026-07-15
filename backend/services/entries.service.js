import pool from "../config/database.js";

const entriesService = {

  async getProducts() {
    const result = await pool.query(`
      SELECT
        id,
        libelle,
        reference
      FROM products
      ORDER BY libelle
    `);

    return result.rows;
  },

  async getPoles() {
    const result = await pool.query(`
      SELECT
        id,
        nom
      FROM poles
      ORDER BY nom
    `);

    return result.rows;
  },

  async getFilieres() {
    const result = await pool.query(`
      SELECT
        id,
        libelle,
        pole_id
      FROM filieres
      ORDER BY libelle
    `);

    return result.rows;
  },

  async getRecentEntries() {
    const result = await pool.query(`
      SELECT
        sm.id,
        sm.quantite,
        sm.created_at,
        p.libelle,
        p.reference
      FROM stock_movements sm
      LEFT JOIN products p
      ON sm.product_id = p.id
      WHERE sm.type = 'entree'
      ORDER BY sm.created_at DESC
      LIMIT 5
    `);

    return result.rows;
  },

  async createEntry(data) {
    const qty = Number(data.quantite ?? data.quantity ?? data.qty ?? 0);

    const result = await pool.query(`
      INSERT INTO stock_movements (
        product_id,
        user_id,
        type,
        quantite,
        motif,
        date_mouvement
      )
      VALUES ($1,$2,'entree',$3,$4,$5)
      RETURNING *
    `,
    [
      data.product_id,
      data.user_id,
      qty,
      data.motif ?? null,
      data.date_mouvement ?? null
    ]);

    await pool.query(`
      UPDATE products
      SET stock_actuel = COALESCE(stock_actuel,0) + $1
      WHERE id = $2
    `,
    [
      qty,
      data.product_id
    ]);

    return result.rows[0];
  }
};

export default entriesService;