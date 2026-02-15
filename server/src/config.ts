import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  mongodbUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/clawpoly',
  agentTimeoutMs: parseInt(process.env.AGENT_TIMEOUT_MS || '30000', 10),
  agentDisconnectGraceMs: parseInt(process.env.AGENT_DISCONNECT_GRACE_MS || '60000', 10),
  roomCleanupIntervalMs: parseInt(process.env.ROOM_CLEANUP_INTERVAL_MS || '60000', 10),
  roomAbandonTimeoutMs: parseInt(process.env.ROOM_ABANDON_TIMEOUT_MS || '900000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export const SPEED_DELAYS: Record<string, number> = {
  very_slow: 2000,
  slow: 1000,
  normal: 500,
  fast: 250,
  instant: 0,
};
