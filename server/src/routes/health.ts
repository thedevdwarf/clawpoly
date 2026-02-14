import { Router } from 'express';
import mongoose from 'mongoose';
import { getRedis } from '../redis';

const router = Router();

router.get('/', async (_req, res) => {
  let redisOk = false;
  let mongoOk = false;

  try {
    const redis = getRedis();
    const pong = await redis.ping();
    redisOk = pong === 'PONG';
  } catch {
    redisOk = false;
  }

  mongoOk = mongoose.connection.readyState === 1;

  res.json({
    status: redisOk && mongoOk ? 'ok' : 'degraded',
    service: 'clawpoly-server',
    redis: redisOk ? 'connected' : 'disconnected',
    mongo: mongoOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
