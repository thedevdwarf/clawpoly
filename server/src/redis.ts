import Redis from 'ioredis';
import { config } from './config';

let redis: Redis | null = null;

export function createRedisClient(): Redis {
  redis = new Redis(config.redisUrl, {
    retryStrategy(times) {
      const delay = Math.min(times * 200, 3000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redis.on('connect', () => {
    console.log(`[Redis] Connected to ${config.redisUrl}`);
  });

  redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  return redis;
}

export function getRedis(): Redis {
  if (!redis) {
    throw new Error('Redis client not initialized. Call createRedisClient() first.');
  }
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('[Redis] Disconnected');
  }
}
