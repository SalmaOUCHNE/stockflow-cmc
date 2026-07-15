import pool from "../config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads');

const stockService = {

  async getProducts() {
    const result = await pool.query(`
      SELECT *
      FROM products
      WHERE is_archived = false
      ORDER BY libelle
    `);

    return result.rows;
  },

  async getFilieres() {
    const result = await pool.query(`
      SELECT id, libelle, pole_id as poleId
      FROM filieres
      ORDER BY libelle
    `);

    return result.rows.map(r => ({ ...r, name: r.libelle }));
  },

  async getPoles() {
    const result = await pool.query(`
      SELECT id, nom
      FROM poles
      ORDER BY nom
    `);

    return result.rows.map(r => ({ id: r.id, name: r.nom }));
  },

  async createProduct(data) {
    // ensure reference default exists
    const referenceValue = data.reference ?? `REF-${Date.now()}`;
    const { libelle, description, category_id, unite_mesure, stock_actuel = 0, seuil_alerte = 0, photo_url } = data;
    const result = await pool.query(`
      INSERT INTO products (reference, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
      RETURNING *
    `, [referenceValue, libelle, description, category_id, unite_mesure, stock_actuel, seuil_alerte, photo_url]);
    return result.rows[0];
  }, 

  async updateProduct(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    const allowed = ['reference','libelle','description','category_id','unite_mesure','stock_actuel','seuil_alerte','photo_url','is_archived'];
    for (const key of allowed) {
      if (key in data) { fields.push(`${key} = $${idx}`); values.push(data[key]); idx++; }
    }
    if (fields.length === 0) {
      const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      return res.rows[0];
    }
    values.push(id);
    const result = await pool.query(`UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`, values);
    return result.rows[0];
  },

  async uploadProductPhoto(id, file) {
    if (!file || !file.filename) {
      throw new Error('Aucun fichier fourni.');
    }

    const { rows } = await pool.query('SELECT photo_url FROM products WHERE id = $1', [id]);
    const previousUrl = rows?.[0]?.photo_url;

    const newPhotoUrl = `/uploads/products/${file.filename}`;
    const result = await pool.query(
      'UPDATE products SET photo_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newPhotoUrl, id]
    );

    if (previousUrl && previousUrl.startsWith('/uploads/')) {
      const relativePreviousPath = previousUrl.replace(/^\/uploads\//, '');
      const previousPath = path.join(uploadsRoot, relativePreviousPath);
      if (fs.existsSync(previousPath)) {
        try { fs.unlinkSync(previousPath); } catch (err) { console.warn('Could not remove previous product image', err); }
      }
    }

    return result.rows[0];
  },

  async deleteProduct(id) {
    await pool.query('UPDATE products SET is_archived = true, updated_at = NOW() WHERE id = $1', [id]);
    return { success: true };
  },

  async getRecentMovements(days = 30, limit = 50) {
    const result = await pool.query(`
      SELECT sm.id, sm.product_id, sm.user_id, sm.type, sm.quantite, sm.motif, sm.date_mouvement, p.libelle as product_libelle, p.reference, p.stock_actuel
      FROM stock_movements sm
      LEFT JOIN products p ON p.id = sm.product_id
      WHERE sm.date_mouvement >= NOW() - ($1 || ' days')::interval
      ORDER BY sm.date_mouvement DESC
      LIMIT $2
    `, [days, limit]);

    return result.rows.map(r => ({
      id: r.id,
      product_id: r.product_id,
      user_id: r.user_id,
      type: r.type,
      quantite: r.quantite,
      date_mouvement: r.date_mouvement,
      product: { id: r.product_id, libelle: r.product_libelle, reference: r.reference, stock_actuel: r.stock_actuel }
    }));
  }

};

export default stockService;