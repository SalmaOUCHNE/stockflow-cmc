import express from 'express';
import auditController from '../controllers/audit.controller.js';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', requireRole('Admin'), auditController.getLogs);
router.post('/', requireRole('Admin'), auditController.log);

export default router;
