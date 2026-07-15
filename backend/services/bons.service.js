
import pool from "../config/database.js";

export const getAllBons = async () => {
  // Limit results to avoid loading extremely large tables which may cause OOM
  const MAX_LIMIT = 500;
  const result = await pool.query(`
    SELECT
      bs.*,
      sm.product_id,
      sm.quantite AS quantity,
      sm.motif AS notes,
      p.libelle AS product_name,
      p.reference AS sku,
      p.unite_mesure AS unit,
      po.nom AS pole_name,
      f.libelle AS filiere_name,
      u.prenom || ' ' || u.nom AS requester_name,
      u.email AS requester_email
    FROM bons_sortie bs
    LEFT JOIN stock_movements sm ON sm.bon_sortie_id = bs.id
    LEFT JOIN products p ON p.id = sm.product_id
    LEFT JOIN poles po ON po.id = bs.pole_id
    LEFT JOIN filieres f ON f.id = bs.filiere_id
    LEFT JOIN users u ON u.id = bs.demandeur_id
    ORDER BY bs.date_emission DESC
    LIMIT ${MAX_LIMIT}
  `);

  return result.rows.map((row) => ({
    ...row,
    bon_number: row.numero,
    status: row.statut === 'emis' ? 'en_attente' : row.statut,
    items: {
      id: row.product_id,
      name: row.product_name,
      sku: row.sku,
      unit: row.unit,
    },
    poles: { name: row.pole_name },
    filieres: { name: row.filiere_name },
    requester_name: row.requester_name || row.requester_email || 'Utilisateur',
    exit_date: row.exit_date || row.date_emission,
  }));
};

export const getBonById = async (id) => {
  const result = await pool.query(
    `
      SELECT bs.*, sm.product_id, sm.quantite AS quantity, sm.motif AS notes, p.libelle AS product_name, p.reference AS sku, p.unite_mesure AS unit,
        po.nom AS pole_name, f.libelle AS filiere_name,
        u.prenom || ' ' || u.nom AS requester_name, u.email AS requester_email
      FROM bons_sortie bs
      LEFT JOIN stock_movements sm ON sm.bon_sortie_id = bs.id
      LEFT JOIN products p ON p.id = sm.product_id
      LEFT JOIN poles po ON po.id = bs.pole_id
      LEFT JOIN filieres f ON f.id = bs.filiere_id
      LEFT JOIN users u ON u.id = bs.demandeur_id
      WHERE bs.id = $1
    `,
    [id]
  );

  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    bon_number: row.numero,
    status: row.statut === 'emis' ? 'en_attente' : row.statut,
    items: {
      id: row.product_id,
      name: row.product_name,
      sku: row.sku,
      unit: row.unit,
    },
    poles: { name: row.pole_name },
    filieres: { name: row.filiere_name },
    requester_name: row.requester_name || row.requester_email || 'Utilisateur',
    exit_date: row.exit_date || row.date_emission,
  };
};

export const updateBonStatus = async (
  id,
  statut,
  refusal_comment = null,
  validateur_id = null
) => {

  const result = await pool.query(
    `
    UPDATE bons_sortie
    SET
      statut=$1,
      refusal_comment=$2,
      validateur_id=$3,
      validated_at=CASE
        WHEN $1='validee'
        THEN NOW()
        ELSE validated_at
      END
    WHERE id=$4
    RETURNING *
    `,
    [
      statut,
      refusal_comment,
      validateur_id,
      id
    ]
  );

  return result.rows[0];
};

export const markDelivered = async (id) => {

  const result = await pool.query(
    `
    UPDATE bons_sortie
    SET
      statut='livree',
      exit_date=NOW()
    WHERE id=$1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0];
};