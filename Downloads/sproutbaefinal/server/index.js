// SproutBae - Express API Server v1.1
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes      from './routes/auth.js';
import customerRoutes  from './routes/customers.js';
import productRoutes   from './routes/products.js';
import invoiceRoutes   from './routes/invoices.js';
import paymentRoutes   from './routes/payments.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes  from './routes/settings.js';
import pdfRoutes       from './routes/pdf.js';
import gstRoutes       from './routes/gst.js';
import whatsappRoutes  from './routes/whatsapp.js';
import vendorRoutes    from './routes/vendors.js';
import poRoutes        from './routes/purchaseOrders.js';
import userRoutes      from './routes/users.js';
import stockRoutes     from './routes/stockPurchase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger (dev) ───────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/customers',  customerRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/invoices',   invoiceRoutes);
app.use('/api/invoices',   pdfRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/gst',        gstRoutes);
app.use('/api/whatsapp',   whatsappRoutes);
app.use('/api/vendors',    vendorRoutes);
app.use('/api/purchase-orders', poRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/stock',      stockRoutes);

// ── Health check ───────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'SproutBae', version: '1.0.0' }));

// ── 404 handler ────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ───────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🌱 SproutBae server running on port ${PORT}`);
});
