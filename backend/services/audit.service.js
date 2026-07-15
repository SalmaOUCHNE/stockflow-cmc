import db from '../config/database.js';

const auditService = {
  log: async ({ action, entite_cible, entite_id, user_id, ip_address, details }) => {
    try {
      let serializedDetails = null;
      if (details !== undefined && details !== null) {
        if (typeof details === 'string') {
          serializedDetails = details;
        } else {
          try {
            serializedDetails = JSON.stringify(details);
          } catch (stringifyError) {
            console.warn('Audit details serialization failed, falling back to toString()', stringifyError);
            serializedDetails = String(details);
          }
        }
      }

      await db.query(
        `INSERT INTO audit_logs (action, entite_cible, entite_id, user_id, ip_address, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [action, entite_cible, entite_id, user_id, ip_address, serializedDetails]
      );
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement d\'audit:', error);
    }
  },
  getLogs: async () => {
    const result = await db.query(
      `SELECT al.*, u.prenom || ' ' || u.nom AS utilisateur, u.email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT 1000`
    );

    return result.rows.map((row) => {
      let parsedDetails = null;
      if (row.details !== undefined && row.details !== null) {
        if (typeof row.details === 'object') {
          parsedDetails = row.details;
        } else if (typeof row.details === 'string') {
          try {
            parsedDetails = JSON.parse(row.details);
          } catch (parseError) {
            console.warn('[AUDIT] getLogs parse error for details, returning raw string', parseError, row.details);
            parsedDetails = row.details;
          }
        } else {
          parsedDetails = row.details;
        }
      }

      return {
        ...row,
        full_name: row.utilisateur?.trim() || row.email || null,
        details: parsedDetails,
      };
    });
  },
};

export default auditService;
