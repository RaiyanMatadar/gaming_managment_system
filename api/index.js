import { createApp } from '../server/src/app.js';
import { connectMongo } from '../server/src/storage/index.js';

let appInstance = null;

export default async function handler(req, res) {
  await connectMongo();
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance(req, res);
}
