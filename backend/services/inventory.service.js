import pool from "../config/database.js";

const getAllInventories = async () => {

  const result = await pool.query(`
    SELECT
      i.*,
      p.nom AS pole_nom,
      f.libelle AS filiere_nom
    FROM inventories i
    LEFT JOIN poles p
      ON p.id = i.pole_id
    LEFT JOIN filieres f
      ON f.id = i.filiere_id
    ORDER BY i.started_at DESC
  `);

  return result.rows;
};

const getPoles = async () => {

  const result = await pool.query(`
    SELECT
      id,
      nom AS name
    FROM poles
    ORDER BY nom
  `);

  return result.rows;
};

const getFilieres = async () => {

  const result = await pool.query(`
    SELECT
      id,
      libelle AS name,
      pole_id
    FROM filieres
    ORDER BY libelle
  `);

  return result.rows;
};

const createInventory = async (data) => {

  const {
    name,
    pole_id,
    filiere_id,
    notes,
    created_by
  } = data;

  const inventoryResult = await pool.query(
    `
    INSERT INTO inventories
    (
      name,
      pole_id,
      filiere_id,
      observations,
      initie_par,
      started_at,
      status
    )
    VALUES
    (
      $1,$2,$3,$4,$5,NOW(),'ouverte'
    )
    RETURNING *
    `,
    [
      name,
      pole_id || null,
      filiere_id || null,
      notes,
      created_by
    ]
  );

  const inventory = inventoryResult.rows[0];

  const productsQuery = await pool.query(
    `
    SELECT id, stock_actuel
    FROM products
    WHERE ($1::uuid IS NULL OR pole_id = $1)
      AND ($2::uuid IS NULL OR filiere_id = $2)
    `,
    [pole_id || null, filiere_id || null]
  );

  if (productsQuery.rows.length > 0) {
    const insertValues = productsQuery.rows
      .map((product, index) => `($1,$${index * 3 + 2},$${index * 3 + 3},NULL,NULL)`)
      .join(', ');

    const insertParams = [inventory.id];
    productsQuery.rows.forEach((product) => {
      insertParams.push(product.id, product.stock_actuel ?? 0);
    });

    await pool.query(
      `
      INSERT INTO inventory_lines (inventory_id, product_id, stock_theorique, stock_physique, motif_ecart)
      VALUES ${insertValues}
      `,
      insertParams
    );
  }

  return inventory;
};

const getInventoryById = async (id) => {

  const session = await pool.query(
    `
    SELECT
      i.*,
      p.nom AS pole_nom,
      f.libelle AS filiere_nom
    FROM inventories i
    LEFT JOIN poles p
      ON p.id = i.pole_id
    LEFT JOIN filieres f
      ON f.id = i.filiere_id
    WHERE i.id = $1
    `,
    [id]
  );

  const lines = await pool.query(
    `
    SELECT
      id,
      inventory_id,
      product_id AS item_id,
      stock_theorique AS theoretical_qty,
      stock_physique AS physical_qty,
      motif_ecart AS justification
    FROM inventory_lines
    WHERE inventory_id = $1
    `,
    [id]
  );

  // Only fetch product details for referenced product_ids to avoid loading entire products table
  const productIds = Array.from(new Set(lines.rows.map(r => r.product_id).filter(Boolean)));
  let items = {};
  if (productIds.length > 0) {
    const products = await pool.query(`
      SELECT id, libelle, reference, unite_mesure
      FROM products
      WHERE id = ANY($1)
    `, [productIds]);

    items = {};
    products.rows.forEach(product => {
      items[product.id] = {
        name: product.libelle,
        sku: product.reference,
        unit: product.unite_mesure
      };
    });
  } else {
    items = {};
  }

  return {
    session: session.rows[0],
    lines: lines.rows,
    items
  };
};

const updateInventoryLine = async (
  id,
  data
) => {
  if (data.physical_qty != null && Number(data.physical_qty) < 0) {
    throw new Error('La quantité physique ne peut pas être négative.');
  }

  const result = await pool.query(
    `
    UPDATE inventory_lines
    SET
      stock_physique = $1,
      motif_ecart = $2,
      counted_at = CASE WHEN $1 IS NOT NULL THEN NOW() ELSE counted_at END
    WHERE id = $3
    RETURNING *
    `,
    [
      data.physical_qty,
      data.justification,
      id
    ]
  );

  return result.rows[0];
};

const closeInventory = async (id) => {
  const missing = await pool.query(
    `
    SELECT COUNT(*)::int as count
    FROM inventory_lines
    WHERE inventory_id = $1
      AND stock_physique IS NULL
    `,
    [id]
  );

  if (missing.rows[0].count > 0) {
    throw new Error('Impossible de clôturer tant que tous les articles n\'ont pas été comptés.');
  }

  const result = await pool.query(
    `
    UPDATE inventories
    SET
      status = 'cloturee',
      date_fin = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0];
};

const deleteInventory = async (id) => {
  await pool.query(
    `
    DELETE FROM inventory_lines
    WHERE inventory_id = $1
    `,
    [id]
  );

  const result = await pool.query(
    `
    DELETE FROM inventories
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0];
};

export default {
  getAllInventories,
  getPoles,
  getFilieres,
  createInventory,
  getInventoryById,
  updateInventoryLine,
  closeInventory,
  deleteInventory
};