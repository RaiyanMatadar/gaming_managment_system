import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes.js';
import stationRoutes from './routes/stationRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import { getCustomerHistory } from './controllers/sessionController.js';
import { store } from './storage/index.js';
import { eventBroadcaster } from './services/eventBroadcaster.js';
import { authMiddleware } from './middleware/authMiddleware.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'GameDashboard Gaming Center Management API'
    });
  });

  // Authentication routes (login, register, me)
  app.use('/api/auth', authRoutes);

  // Server-Sent Events (SSE) stream for live cashier notifications
  app.get('/api/events', (req, res) => {
    eventBroadcaster.handleSSEConnection(req, res);
  });

  // Audit logs endpoint for shift verification and audit trail
  app.get('/api/audit', authMiddleware, async (req, res, next) => {
    try {
      const { limit, search, action } = req.query;
      const logs = await store.getAuditLogs({
        limit: Number(limit) || 100,
        search: search || '',
        action: action || '',
        userId: req.user?.id || null
      });
      res.json({ success: true, count: logs.length, data: logs });
    } catch (err) {
      next(err);
    }
  });

  // Customer history direct endpoints
  app.get('/api/customers/history', authMiddleware, getCustomerHistory);
  app.get('/api/customers', authMiddleware, getCustomerHistory);
  app.get('/api/customer-history', authMiddleware, getCustomerHistory);

  // Main feature routes protected by authentication
  app.use('/api/stations', authMiddleware, stationRoutes);
  app.use('/api/sessions', authMiddleware, sessionRoutes);
  app.use('/api/reports', authMiddleware, reportRoutes);
  app.use('/api/whatsapp', whatsappRoutes);

  // Serve static production frontend if built
  const candidateDistPaths = [
    path.join(process.cwd(), 'client', 'dist'),
    path.join(process.cwd(), '..', 'client', 'dist'),
    path.join(process.cwd(), 'dist')
  ];
  const distPath = candidateDistPaths.find(p => fs.existsSync(p));
  if (distPath) {
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        return res.sendFile(path.join(distPath, 'index.html'));
      }
      next();
    });
  }

  // 404 Handler for unmatched API endpoints
  app.use((req, res) => {
    res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  // Centralized Error Handler
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  });

  return app;
}

export const app = createApp();
