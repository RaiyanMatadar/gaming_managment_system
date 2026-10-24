import { createApp } from '../src/app.js';
import { connectMongo } from '../src/storage/index.js';

let appInstance = null;

export default async function handler(req, res) {
  // Ensure database connection
  await connectMongo();

  if (!appInstance) {
    appInstance = createApp();
  }

  return appInstance(req, res);
}
