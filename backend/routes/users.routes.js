import express from 'express';
import usersController from '../controllers/users.controller.js';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Authentification requise pour toutes les routes
router.use(authMiddleware);

// Obtenir le profil de l'utilisateur connecté
router.get('/me', usersController.me);
router.put('/me', usersController.updateMe);
router.put('/me/password', usersController.updatePassword);

// Routes administrateur
router.get('/', requireRole('Admin'), usersController.getUsers);
router.get('/:id', requireRole('Admin'), usersController.getUserById);
router.post('/', requireRole('Admin'), usersController.createUser);
router.put('/:id', requireRole('Admin'), usersController.updateUser);
router.patch('/:id/toggle-status', requireRole('Admin'), usersController.toggleUserStatus);
router.patch('/:id/role', requireRole('Admin'), usersController.changeUserRole);
router.patch('/:id/approve', requireRole('Admin'), usersController.approveUser);
router.patch('/:id/reject', requireRole('Admin'), usersController.rejectUser);
router.delete('/:id', requireRole('Admin'), usersController.deleteUser);

export default router;
