import { app } from '../src/app.js';
import { connectMongo } from '../src/storage/index.js';

let isConnecting = false;

async function ensureDb() {
  if (process.env.MONGO_URI && !isConnecting) {
    isConnecting = true;
    try {
      await connectMongo(process.env.MONGO_URI);
    } catch (err) {
      console.error('[VERCEL] MongoDB connection error:', err.message);
    } finally {
      isConnecting = false;
    }
  }
}

export default async function handler(req, res) {
  await ensureDb();
  return app(req, res);
}
