import express from "express";
import {
  getAllInventories,
  getPoles,
  getFilieres,
  createInventory,
  getInventoryById,
  updateInventoryLine,
  closeInventory,
  deleteInventory
} from "../controllers/inventory.controller.js";

const router = express.Router();

router.get("/", getAllInventories);
router.get("/poles", getPoles);
router.get("/filieres", getFilieres);

router.post("/", createInventory);

router.get("/:id", getInventoryById);

router.put("/line/:id", updateInventoryLine);

router.put("/:id/close", closeInventory);
router.delete("/:id", deleteInventory);

export default router;