import express from "express";
import entriesController from "../controllers/entries.controller.js";
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(authMiddleware);

router.get("/products", entriesController.getProducts);
router.get("/poles", entriesController.getPoles);
router.get("/filieres", entriesController.getFilieres);
router.get("/recent", entriesController.getRecentEntries);

router.post("/", entriesController.createEntry);

export default router;