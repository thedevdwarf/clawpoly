import WebSocket from 'ws';
import { getRedis } from '../redis';
import { loadGameState } from '../state/redisState';
import { WSMessage } from '../types/messages';
import { GameEvent } from '../types/game';

function sendMessage(ws: WebSocket, type: string, data: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    const msg: WSMessage = { type, data, timestamp: new Date().toISOString() };
    ws.send(JSON.stringify(msg));
  }
}

// Spectator connections by roomId
const spectatorsByRoom = new Map<string, Set<WebSocket>>();

export function broadcastToSpectators(roomId: string, type: string, data: Record<string, unknown>): void {
  const spectators = spectatorsByRoom.get(roomId);
  if (!spectators) return;

  const msg: WSMessage = { type, data, timestamp: new Date().toISOString() };
  const payload = JSON.stringify(msg);

  for (const ws of spectators) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

export function broadcastEvent(roomId: string, event: GameEvent): void {
  broadcastToSpectators(roomId, event.type, event.data);
}

export async function handleSpectatorConnection(ws: WebSocket, roomCode: string): Promise<void> {
  const redis = getRedis();

  // Resolve roomCode to roomId
  const roomId = await redis.hget('rooms:codes', roomCode);
  if (!roomId) {
    sendMessage(ws, 'error', { code: 'INVALID_ROOM_CODE', message: 'Room not found' });
    ws.close(4004, 'Invalid room code');
    return;
  }

  // Add to spectator set
  if (!spectatorsByRoom.has(roomId)) {
    spectatorsByRoom.set(roomId, new Set());
  }
  spectatorsByRoom.get(roomId)!.add(ws);

  console.log(`[Spectator] Connected to room ${roomId} (code: ${roomCode})`);

  // Send current game state
  const state = await loadGameState(roomId);
  if (state) {
    sendMessage(ws, 'game:state', state as unknown as Record<string, unknown>);
  }

  // Handle spectator commands
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as WSMessage;
      switch (msg.type) {
        case 'spectator:set_speed':
        case 'spectator:pause':
        case 'spectator:resume':
          // TODO: Implement speed control when game loop supports it
          sendMessage(ws, 'error', { code: 'NOT_IMPLEMENTED', message: 'Speed control not yet implemented' });
          break;
        default:
          sendMessage(ws, 'error', { code: 'INVALID_ACTION', message: `Unknown command: ${msg.type}` });
      }
    } catch {
      sendMessage(ws, 'error', { code: 'INVALID_ACTION', message: 'Invalid JSON' });
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    const spectators = spectatorsByRoom.get(roomId);
    if (spectators) {
      spectators.delete(ws);
      if (spectators.size === 0) {
        spectatorsByRoom.delete(roomId);
      }
    }
    console.log(`[Spectator] Disconnected from room ${roomId}`);
  });

  ws.on('error', (err) => {
    console.error(`[Spectator] WebSocket error:`, err.message);
  });
}
