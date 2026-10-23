import { app } from '../src/app.js';
import { connectMongo } from '../src/storage/index.js';

// Ensure MongoDB is connected
if (process.env.MONGO_URI) {
  connectMongo(process.env.MONGO_URI).catch(err => {
    console.error('[VERCEL] MongoDB connection error:', err.message);
  });
}

// Middleware to ensure DB connection on serverless cold starts
app.use(async (req, res, next) => {
  if (process.env.MONGO_URI) {
    try {
      await connectMongo(process.env.MONGO_URI);
    } catch {}
  }
  next();
});

// Root welcome route for Vercel deployment preview
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'GameDashboard Gaming Center Management API',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString()
  });
});

export default app;
