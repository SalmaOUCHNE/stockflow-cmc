import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import usersRoutes from './routes/users.routes.js';
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import stockRoutes from "./routes/stock.routes.js";
import entriesRoutes from './routes/entries.routes.js';
import exitsRoutes from './routes/exits.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import bonsRoutes from "./routes/bons.routes.js";
import notificationsRoutes from './routes/notifications.routes.js';
import auditRoutes from './routes/audit.routes.js';
import polesRoutes from './routes/poles.routes.js';
import filieresRoutes from './routes/filieres.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import requestsRoutes from './routes/requests.routes.js';
dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use("/api/stock", stockRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/exits', exitsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use("/api/bons", bonsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/requests', requestsRoutes);

// Reference data
app.use('/api/poles', polesRoutes);
app.use('/api/filieres', filieresRoutes);
app.use('/api/categories', categoriesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Serve uploaded static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'public', 'uploads');
app.use('/uploads', express.static(uploadsDir));


// Client-side debug logs endpoint
app.post('/api/debug/logs', (req, res) => {
  try {
    console.log('[CLIENT LOG]', JSON.stringify(req.body));
  } catch (e) {
    console.log('[CLIENT LOG] (malformed)');
  }
  res.json({ ok: true });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 StockFlow API - Port ${PORT}`);
});
