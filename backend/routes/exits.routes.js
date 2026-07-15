import express from 'express';
import exitsController from '../controllers/exits.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/products', exitsController.getProducts);
router.get('/poles', exitsController.getPoles);
router.get('/filieres', exitsController.getFilieres);

router.post('/', exitsController.createExit);

export default router;