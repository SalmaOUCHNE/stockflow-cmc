import express from 'express';
import notificationsController from '../controllers/notifications.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', notificationsController.getNotifications);
router.get('/unread-count', notificationsController.getUnreadCount);
router.post('/mark-read', notificationsController.markRead);

export default router;
