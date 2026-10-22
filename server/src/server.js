import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { app } from './app.js';
import { expiryPoller } from './services/expiryPoller.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

async function startServer() {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('Connected to MongoDB database.');
    } catch (err) {
      console.warn('MongoDB connection failed. Operating in in-memory storage mode:', err.message);
    }
  } else {
    console.log('No MONGO_URI provided. Operating in high-performance in-memory storage mode.');
  }

  // Start background expiration poller
  expiryPoller.start(5000);

  const server = app.listen(PORT, () => {
    console.log(`Gaming Center Management API listening on port ${PORT}`);
  });

  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { startServer };
