import express from 'express';
import { getPoles } from '../controllers/poles.controller.js';
const router = express.Router();

router.get('/', getPoles);

export default router;
