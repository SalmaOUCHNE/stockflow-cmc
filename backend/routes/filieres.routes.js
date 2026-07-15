import express from 'express';
import { getFilieres, getFilieresByPole } from '../controllers/filieres.controller.js';
const router = express.Router();

router.get('/', getFilieres);
router.get('/by-pole/:poleId', getFilieresByPole);

export default router;
