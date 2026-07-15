import pool from '../config/database.js';
import notificationsService from './notifications.service.js';

const requestsService = {
  // Create a new product request
  async create(data) {
    const {
      product_id,
      quantite_demandee,
      demandeur_id,
      pole_id,
      filiere_id,
    } = data;

    // Validate
    if (!product_id || !quantite_demandee || !demandeur_id || !pole_id) {
      throw new Error('product_id, quantite_demandee, demandeur_id, pole_id sont requis');
    }

    // Insert request
    const result = await pool.query(`
      INSERT INTO requests (product_id, quantite_demandee, demandeur_id, pole_id, filiere_id, statut, date_demande)
      VALUES ($1, $2, $3, $4, $5, 'en_attente', NOW())
      RETURNING id, product_id, quantite_demandee, demandeur_id, pole_id, filiere_id, statut, date_demande
    `, [product_id, quantite_demandee, demandeur_id, pole_id, filiere_id || null]);

    const request = result.rows[0];

    // Get product and requester details for notification
    const productRes = await pool.query('SELECT libelle FROM products WHERE id = $1', [product_id]);
    const requesterRes = await pool.query('SELECT nom, prenom FROM users WHERE id = $1', [demandeur_id]);
    
    const product = productRes.rows[0];
    const requester = requesterRes.rows[0];
    
    // Notify all admins about new request
    await notificationsService.notifyAdmins(
      'product_request',
      `Nouvelle demande de ${product?.libelle || 'article inconnu'} (${quantite_demandee} unités) par ${requester?.prenom || ''} ${requester?.nom || ''}`,
      `/requests/${request.id}`
    );

    return request;
  },

  // Get all requests with optional filters
  async getAll(filters = {}) {
    let query = 'SELECT r.*, p.libelle as product_name, p.reference FROM requests r LEFT JOIN products p ON r.product_id = p.id WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND r.statut = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.demandeur_id) {
      query += ` AND r.demandeur_id = $${paramIndex}`;
      params.push(filters.demandeur_id);
      paramIndex++;
    }

    query += ' ORDER BY r.date_demande DESC';

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Get a specific request
  async getById(id) {
    const result = await pool.query(`
      SELECT r.*, p.libelle as product_name, p.reference, u.nom, u.prenom, u.email
      FROM requests r
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN users u ON r.demandeur_id = u.id
      WHERE r.id = $1
    `, [id]);

    return result.rows[0] || null;
  },

  // Approve a request
  async approve(id) {
    const request = await this.getById(id);
    if (!request) throw new Error('Demande non trouvée');
    if (request.statut !== 'en_attente') throw new Error('Seules les demandes en attente peuvent être approuvées');

    const result = await pool.query(`
      UPDATE requests SET statut = 'validee', date_traitement = NOW()
      WHERE id = $1
      RETURNING id, demandeur_id
    `, [id]);

    const updated = result.rows[0];

    // Notify requester
    await notificationsService.notifyUser(
      updated.demandeur_id,
      'request_approved',
      `Votre demande #${id} a été approuvée.`,
      `/requests/${id}`
    );

    return updated;
  },

  // Reject a request
  async reject(id, reason) {
    const request = await this.getById(id);
    if (!request) throw new Error('Demande non trouvée');
    if (request.statut !== 'en_attente') throw new Error('Seules les demandes en attente peuvent être refusées');

    const result = await pool.query(`
      UPDATE requests SET statut = 'rejetee', date_traitement = NOW(), motif_rejet = $2
      WHERE id = $1
      RETURNING id, demandeur_id
    `, [id, reason || 'Aucune raison spécifiée']);

    const updated = result.rows[0];

    // Notify requester
    await notificationsService.notifyUser(
      updated.demandeur_id,
      'request_rejected',
      `Votre demande #${id} a été refusée. Raison: ${reason || 'Non spécifiée'}`,
      `/requests/${id}`
    );

    return updated;
  },
};

export default requestsService;
