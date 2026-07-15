import usersService from '../services/users.service.js';
import auditService from '../services/audit.service.js';

const usersController = {
  // GET /api/users - Liste avec filtres et pagination
  getUsers: async (req, res) => {
    try {
      const { role, is_active, search, page = 1, limit = 10 } = req.query;

      const result = await usersService.getUsers({
        role,
        is_active,
        search,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/users/:id - Détails complets
  getUserById: async (req, res) => {
    try {
      const user = await usersService.getUserById(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/users/me - Profil connecté
  me: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Non authentifié' });
      const user = await usersService.getUserById(userId);
      if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      const full_name = `${user.prenom ?? ''} ${user.nom ?? ''}`.trim();
      res.json({
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        full_name,
        email: user.email,
        role: user.role_id || user.role,
        fonction: user.fonction ?? null,
        avatar_url: user.avatar_url ?? null,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/users - Créer un utilisateur
  createUser: async (req, res) => {
    try {
      const { nom, prenom, email, role_id, pole_id } = req.body;

      // Validation
      if (!nom || !prenom || !email || !role_id) {
        return res.status(400).json({ error: 'Champs requis manquants' });
      }

      // Vérifier unicité email
      const existingUser = await usersService.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email déjà utilisé' });
      }

      // Créer l'utilisateur
      const newUser = await usersService.createUser({
        nom,
        prenom,
        email,
        role_id,
        pole_id,
      });

      // Enregistrer dans audit
      await auditService.log({
        action: 'CREATE_USER',
        entite_cible: 'users',
        entite_id: newUser.id,
        user_id: req.user.id,
        ip_address: req.ip,
      });

      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/users/:id - Modifier un utilisateur
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { nom, prenom, email, role_id } = req.body;

      const user = await usersService.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Impossible de modifier le rôle de son propre compte
      if (role_id && req.user.id === id && role_id !== user.role_id) {
        return res.status(400).json({ error: 'Impossible de modifier votre propre rôle' });
      }

      // Vérifier unicité email si modifié
      if (email && email !== user.email) {
        const existingEmail = await usersService.findByEmail(email);
        if (existingEmail) {
          return res.status(409).json({ error: 'Email déjà utilisé' });
        }
      }

      // Préparer les changements
      const changes = {};
      if (nom && nom !== user.nom) changes.nom = nom;
      if (prenom && prenom !== user.prenom) changes.prenom = prenom;
      if (email && email !== user.email) changes.email = email;
      if (role_id && role_id !== user.role_id) changes.role_id = role_id;

      if (Object.keys(changes).length === 0) {
        return res.json(user);
      }

      // Mettre à jour
      const updatedUser = await usersService.updateUser(id, changes);

      // Enregistrer dans audit
      await auditService.log({
        action: 'UPDATE_USER',
        entite_cible: 'users',
        entite_id: id,
        user_id: req.user.id,
        ip_address: req.ip,
        details: { champs_modifies: changes },
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/users/me - Mettre à jour le profil connecté
  updateMe: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Non authentifié' });

      const { nom, prenom, email } = req.body;
      const user = await usersService.getUserById(userId);
      if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

      // Vérifier unicité email si modifié
      if (email && email !== user.email) {
        const existingEmail = await usersService.findByEmail(email);
        if (existingEmail) {
          return res.status(409).json({ error: 'Email déjà utilisé' });
        }
      }

      const changes = {};
      if (nom && nom !== user.nom) changes.nom = nom;
      if (prenom && prenom !== user.prenom) changes.prenom = prenom;
      if (email && email !== user.email) changes.email = email;

      if (Object.keys(changes).length === 0) return res.json(user);

      const updatedUser = await usersService.updateUser(userId, changes);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/users/me/password - Mettre à jour le mot de passe du profil connecté
  updatePassword: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Non authentifié' });

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword et newPassword requis' });

      await usersService.updatePassword(userId, currentPassword, newPassword);
      res.json({ message: 'Mot de passe mis à jour' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // PATCH /api/users/:id/toggle-status - Activer/Désactiver
  toggleUserStatus: async (req, res) => {
    try {
      const { id } = req.params;

      // Impossible de désactiver son propre compte
      if (req.user.id === id) {
        return res.status(400).json({ error: 'Impossible de désactiver votre propre compte' });
      }

      const user = await usersService.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const newStatus = !user.is_active;
      const updatedUser = await usersService.updateUser(id, { is_active: newStatus });

      // Enregistrer dans audit
      await auditService.log({
        action: newStatus ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        entite_cible: 'users',
        entite_id: id,
        user_id: req.user.id,
        ip_address: req.ip,
      });

      // Si désactivation : invalider les sessions (optionnel)
      if (!newStatus) {
        // Implémenter la blacklist de tokens si nécessaire
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PATCH /api/users/:id/role - Changer le rôle
  changeUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role_id } = req.body;

      if (!role_id) {
        return res.status(400).json({ error: 'role_id requis' });
      }

      // Impossible de changer son propre rôle
      if (req.user.id === id) {
        return res.status(400).json({ error: 'Impossible de modifier votre propre rôle' });
      }

      const user = await usersService.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const ancien_role = user.role_id;
      const updatedUser = await usersService.updateUser(id, { role_id });

      // Enregistrer dans audit
      await auditService.log({
        action: 'CHANGE_ROLE',
        entite_cible: 'users',
        entite_id: id,
        user_id: req.user.id,
        ip_address: req.ip,
        details: { ancien_role, nouveau_role: role_id },
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // DELETE /api/users/:id - Supprimer un utilisateur
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Impossible de supprimer son propre compte
      if (req.user.id === id) {
        return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
      }

      const user = await usersService.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Vérifier que l'user n'a pas de mouvements de stock liés
      const hasStockMovements = await usersService.checkStockMovements(id);
      if (hasStockMovements) {
        return res.status(409).json({
          error: 'Impossible de supprimer cet utilisateur. Il possède des mouvements de stock enregistrés.',
        });
      }

      // Supprimer
      await usersService.deleteUser(id);

      // Enregistrer dans audit
      await auditService.log({
        action: 'DELETE_USER',
        entite_cible: 'users',
        entite_id: id,
        user_id: req.user.id,
        ip_address: req.ip,
        details: { user_supprime: { nom: user.nom, email: user.email } },
      });

      res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PATCH /api/users/:id/approve - Approve pending user registration
  approveUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await usersService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      if (user.status !== 'pending') {
        return res.status(400).json({ error: 'Seuls les comptes en attente peuvent être approuvés' });
      }

      const approvedUser = await usersService.approveUser(id);

      // Log to audit
      await auditService.log({
        action: 'APPROVE_USER',
        entite_cible: 'users',
        entite_id: id,
        user_id: req.user.id,
        ip_address: req.ip,
        details: { user_email: approvedUser.email },
      });

      res.json(approvedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PATCH /api/users/:id/reject - Reject pending user registration
  rejectUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const user = await usersService.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      if (user.status !== 'pending') {
        return res.status(400).json({ error: 'Seuls les comptes en attente peuvent être refusés' });
      }

      const rejectedUser = await usersService.rejectUser(id, reason);

      // Log to audit
      await auditService.log({
        action: 'REJECT_USER',
        entite_cible: 'users',
        entite_id: id,
        user_id: req.user.id,
        ip_address: req.ip,
        details: { user_email: rejectedUser.email, reason },
      });

      res.json(rejectedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default usersController;
