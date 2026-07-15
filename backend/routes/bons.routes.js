import express from "express";

import {
  getAllBons,
  getBonById,
  validateBon,
  rejectBon,
  deliverBon
} from "../controllers/bons.controller.js";

const router = express.Router();

router.get("/", getAllBons);

router.get("/:id", getBonById);

router.put(
  "/:id/validate",
  validateBon
);

router.put(
  "/:id/reject",
  rejectBon
);

router.put(
  "/:id/deliver",
  deliverBon
);

export default router;