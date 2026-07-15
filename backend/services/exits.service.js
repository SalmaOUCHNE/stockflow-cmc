import pool from '../config/database.js';

const exitsService = {

  async getProducts() {
    const result = await pool.query(`
      SELECT
        id,
        libelle,
        reference,
        stock_actuel,
        unite_mesure,
        seuil_alerte
      FROM products
      WHERE is_archived = false
      ORDER BY libelle
    `);

    return result.rows;
  },

  async getPoles() {
    const result = await pool.query(`
      SELECT id, nom
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

  async createExit(data) {

    const {
      product_id,
      quantity,
      requester_name,
      filiere_id,
      pole_id,
      exit_date,
      notes,
      bon_number,
      user_id
    } = data;

    const qty = Number(quantity ?? data.quantite ?? 0);

    const product = await pool.query(`
      SELECT stock_actuel
      FROM products
      WHERE id = $1
    `,[product_id]);

    if(product.rows.length === 0){
      throw new Error("Produit introuvable");
    }

    if(product.rows[0].stock_actuel < qty){
      throw new Error("Stock insuffisant");
    }

    const client = await pool.connect();

    try {

      await client.query('BEGIN');

      const numeroValue = bon_number ?? `BON-${Date.now()}`;

      const bonResult = await client.query(`
        INSERT INTO bons_sortie(
          numero,
          date_emission,
          demandeur_id,
          pole_id,
          filiere_id,
          statut
        )
        VALUES($1,$2,$3,$4,$5,'emis')
        RETURNING id
      `,
      [
        numeroValue,
        exit_date,
        user_id,
        pole_id || null,
        filiere_id || null
      ]);

      const bonId = bonResult.rows[0]?.id;

      await client.query(`
        INSERT INTO stock_movements(
          product_id,
          user_id,
          type,
          quantite,
          motif,
          date_mouvement,
          bon_sortie_id
        )
        VALUES($1,$2,'sortie',$3,$4,$5,$6)
      `,
      [
        product_id,
        user_id,
        qty,
        notes,
        exit_date,
        bonId,
      ]);

      await client.query(`
        UPDATE products
        SET stock_actuel = stock_actuel - $1
        WHERE id = $2
      `,
      [
        qty,
        product_id
      ]);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Sortie enregistrée'
      };

    } catch(error){

      await client.query('ROLLBACK');
      throw error;

    } finally {

      client.release();

    }
  }

};

export default exitsService;