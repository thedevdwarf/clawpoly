import { getRedis } from '../redis';
import { GameState, GameEvent } from '../types/game';

export async function saveGameState(roomId: string, state: GameState): Promise<void> {
  const redis = getRedis();
  await redis.set(`room:${roomId}:state`, JSON.stringify(state));
}

export async function loadGameState(roomId: string): Promise<GameState | null> {
  const redis = getRedis();
  const raw = await redis.get(`room:${roomId}:state`);
  if (!raw) return null;
  return JSON.parse(raw) as GameState;
}

export async function appendEvent(roomId: string, event: GameEvent): Promise<void> {
  const redis = getRedis();
  await redis.rpush(`room:${roomId}:log`, JSON.stringify(event));
}

export async function getEventLog(roomId: string, from = 0, limit = 50): Promise<GameEvent[]> {
  const redis = getRedis();
  const raw = await redis.lrange(`room:${roomId}:log`, from, from + limit - 1);
  return raw.map((r) => JSON.parse(r) as GameEvent);
}

export async function cleanupRoom(roomId: string, delayMs?: number): Promise<void> {
  const redis = getRedis();
  const keys = [
    `room:${roomId}`,
    `room:${roomId}:state`,
    `room:${roomId}:players`,
    `room:${roomId}:tokens`,
    `room:${roomId}:log`,
  ];

  if (delayMs && delayMs > 0) {
    const ttlSec = Math.ceil(delayMs / 1000);
    for (const key of keys) {
      await redis.expire(key, ttlSec);
    }
  } else {
    await redis.del(...keys);
  }
}
