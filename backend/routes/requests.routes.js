import express from 'express';
import requestsController from '../controllers/requests.controller.js';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new request
router.post('/', requestsController.create);

// List requests
router.get('/', requestsController.getAll);

// Get a specific request
router.get('/:id', requestsController.getById);

// Admin routes to approve/reject
router.patch('/:id/approve', requireRole('Admin'), requestsController.approve);
router.patch('/:id/reject', requireRole('Admin'), requestsController.reject);

export default router;
