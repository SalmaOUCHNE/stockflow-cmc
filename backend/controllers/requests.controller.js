import requestsService from '../services/requests.service.js';
import auditService from '../services/audit.service.js';

const requestsController = {
  // POST /api/requests - Create a new request
  async create(req, res) {
    try {
      const { product_id, quantite_demandee, pole_id, filiere_id } = req.body;
      const demandeur_id = req.user?.id;

      if (!demandeur_id) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const request = await requestsService.create({
        product_id,
        quantite_demandee,
        demandeur_id,
        pole_id,
        filiere_id,
      });

      await auditService.log({
        action: 'CREATE_REQUEST',
        entite_cible: 'requests',
        entite_id: request.id,
        user_id: demandeur_id,
        ip_address: req.ip,
      });

      res.status(201).json(request);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/requests - List all requests (with filters)
  async getAll(req, res) {
    try {
      const { status, demandeur_id } = req.query;
      const userId = req.user?.id;

      // Non-admins can only see their own requests
      let filters = {};
      if (status) filters.status = status;
      
      if (req.user?.role !== 'Admin') {
        filters.demandeur_id = userId;
      } else if (demandeur_id) {
        filters.demandeur_id = demandeur_id;
      }

      const requests = await requestsService.getAll(filters);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/requests/:id - Get a specific request
  async getById(req, res) {
    try {
      const { id } = req.params;
      const request = await requestsService.getById(id);

      if (!request) {
        return res.status(404).json({ error: 'Demande non trouvée' });
      }

      // Check permissions: user can only see their own requests, admins can see all
      if (req.user?.role !== 'Admin' && request.demandeur_id !== req.user?.id) {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      res.json(request);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PATCH /api/requests/:id/approve - Approve a request (admin only)
  async approve(req, res) {
    try {
      const { id } = req.params;

      if (req.user?.role !== 'Admin') {
        return res.status(403).json({ error: 'Seuls les administrateurs peuvent approuver' });
      }

      const request = await requestsService.approve(id);

      await auditService.log({
        action: 'APPROVE_REQUEST',
        entite_cible: 'requests',
        entite_id: id,
        user_id: req.user?.id,
        ip_address: req.ip,
      });

      res.json({ success: true, message: 'Demande approuvée', request });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PATCH /api/requests/:id/reject - Reject a request (admin only)
  async reject(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (req.user?.role !== 'Admin') {
        return res.status(403).json({ error: 'Seuls les administrateurs peuvent refuser' });
      }

      const request = await requestsService.reject(id, reason);

      await auditService.log({
        action: 'REJECT_REQUEST',
        entite_cible: 'requests',
        entite_id: id,
        user_id: req.user?.id,
        ip_address: req.ip,
        details: { reason },
      });

      res.json({ success: true, message: 'Demande refusée', request });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default requestsController;
