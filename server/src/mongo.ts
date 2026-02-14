import mongoose from 'mongoose';
import { config } from './config';

export async function connectMongo(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUrl);
    console.log(`[MongoDB] Connected to ${config.mongodbUrl}`);
  } catch (err) {
    console.error('[MongoDB] Connection error:', err);
    throw err;
  }
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected');
}
