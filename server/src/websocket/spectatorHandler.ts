import WebSocket from 'ws';
import { getRedis } from '../redis';
import { loadGameState, getEventLog } from '../state/redisState';
import { WSMessage } from '../types/messages';
import { GameEvent } from '../types/game';
import { pauseGame, resumeGame, setGameSpeed } from '../room/roomManager';

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
  broadcastToSpectators(roomId, event.type, {
    ...event.data,
    playerId: event.playerId,
    sequence: event.sequence,
    turnNumber: event.turnNumber,
  });
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
    // Also send pause state explicitly
    if (state.gamePhase === 'paused') {
      sendMessage(ws, 'game:paused', { paused: true });
    }
  }

  // Send event log history
  try {
    const events = await getEventLog(roomId, 0, 1000);
    if (events.length > 0) {
      sendMessage(ws, 'game:history', { events });
    }
  } catch (err) {
    console.error(`[Spectator] Failed to load event history for room ${roomId}:`, err);
  }

  // Handle spectator commands
  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as WSMessage;
      switch (msg.type) {
        case 'spectator:pause':
          if (await pauseGame(roomId)) {
            console.log(`[Spectator] Game paused in room ${roomId}`);
          } else {
            sendMessage(ws, 'error', { code: 'CANNOT_PAUSE', message: 'Game is already paused or finished' });
          }
          break;
        case 'spectator:resume':
          if (await resumeGame(roomId)) {
            console.log(`[Spectator] Game resumed in room ${roomId}`);
          } else {
            sendMessage(ws, 'error', { code: 'CANNOT_RESUME', message: 'Game is not paused or finished' });
          }
          break;
        case 'spectator:set_speed': {
          const speed = msg.data?.speed as string;
          if (!speed) {
            sendMessage(ws, 'error', { code: 'INVALID_SPEED', message: 'speed is required' });
            break;
          }
          if (await setGameSpeed(roomId, speed)) {
            console.log(`[Spectator] Speed changed to ${speed} in room ${roomId}`);
          } else {
            sendMessage(ws, 'error', { code: 'CANNOT_SET_SPEED', message: 'Game not running' });
          }
          break;
        }
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
