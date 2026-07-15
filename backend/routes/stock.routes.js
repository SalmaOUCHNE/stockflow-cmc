import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import stockController from "../controllers/stock.controller.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename(req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '-');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Le format de l\'image doit être JPG, PNG ou WEBP.'));
    }
    cb(null, true);
  },
});

router.get("/products", stockController.getProducts);
router.get("/filieres", stockController.getFilieres);
router.get("/poles", stockController.getPoles);
router.get('/recent-movements', stockController.getRecentMovements);
router.post('/:id/photo', upload.single('image'), stockController.uploadProductPhoto);

// CRUD
router.post('/', stockController.createProduct);
router.put('/:id', stockController.updateProduct);
router.delete('/:id', stockController.deleteProduct);

export default router;