import { v4 as uuidv4 } from 'uuid';
import { getRedis } from '../redis';
import { generateRoomCode } from './roomCode';
import { createInitialGameState } from '../state/gameState';
import { saveGameState, loadGameState, appendEvent } from '../state/redisState';
import { GameConfig, GameSpeed } from '../types/game';
import { TokenType, TOKEN_COLORS } from '../types/player';
import { determineTurnOrder } from '../engine/turnOrder';
import { GameEngine } from '../engine/gameEngine';
import { RandomAgent } from '../engine/agents/randomAgent';
import { AgentDecision } from '../types/agent';
import { broadcastEvent } from '../websocket/spectatorHandler';

const ALL_TOKENS: TokenType[] = ['lobster', 'crab', 'octopus', 'seahorse', 'dolphin', 'shark'];

// Registered agents per room
const registeredAgents = new Map<string, Map<string, AgentDecision>>();

export function registerAgent(roomId: string, playerId: string, agent: AgentDecision): void {
  if (!registeredAgents.has(roomId)) {
    registeredAgents.set(roomId, new Map());
  }
  registeredAgents.get(roomId)!.set(playerId, agent);
}

export function getRegisteredAgents(roomId: string): Map<string, AgentDecision> {
  return registeredAgents.get(roomId) || new Map();
}

interface RoomInfo {
  roomId: string;
  roomCode: string;
  roomName: string;
  maxPlayers: number;
  gameSpeed: GameSpeed;
  turnLimit: number;
  createdAt: string;
}

interface JoinResult {
  playerId: string;
  agentToken: string;
  token: TokenType;
  color: string;
}

class RoomManager {
  async createRoom(name: string, config: Partial<GameConfig> = {}): Promise<RoomInfo> {
    const redis = getRedis();
    const roomId = uuidv4();
    const roomCode = generateRoomCode();
    const maxPlayers = config.maxPlayers || 4;
    const gameSpeed = config.gameSpeed || 'normal';
    const turnLimit = config.turnLimit ?? 200;

    const state = createInitialGameState(roomId, roomCode, name, { maxPlayers, gameSpeed, turnLimit });
    await saveGameState(roomId, state);

    const now = new Date().toISOString();
    await redis.hset(`room:${roomId}`, {
      roomId,
      roomCode,
      roomName: name,
      maxPlayers: String(maxPlayers),
      gameSpeed,
      turnLimit: String(turnLimit),
      gamePhase: 'waiting',
      createdAt: now,
    });

    await redis.sadd('rooms:active', roomId);
    await redis.hset('rooms:codes', roomCode, roomId);

    return { roomId, roomCode, roomName: name, maxPlayers, gameSpeed, turnLimit, createdAt: now };
  }

  async getRoom(roomId: string): Promise<Record<string, string> | null> {
    const redis = getRedis();
    const data = await redis.hgetall(`room:${roomId}`);
    if (!data || !data.roomId) return null;
    return data;
  }

  async getRoomByCode(roomCode: string): Promise<string | null> {
    const redis = getRedis();
    return await redis.hget('rooms:codes', roomCode);
  }

  async listRooms(): Promise<Record<string, string>[]> {
    const redis = getRedis();
    const roomIds = await redis.smembers('rooms:active');
    const rooms: Record<string, string>[] = [];
    for (const id of roomIds) {
      const room = await this.getRoom(id);
      if (room) rooms.push(room);
    }
    return rooms;
  }

  async deleteRoom(roomId: string): Promise<void> {
    const redis = getRedis();
    const room = await this.getRoom(roomId);
    if (room) {
      await redis.hdel('rooms:codes', room.roomCode);
    }
    await redis.srem('rooms:active', roomId);
    await redis.del(
      `room:${roomId}`,
      `room:${roomId}:state`,
      `room:${roomId}:players`,
      `room:${roomId}:tokens`,
      `room:${roomId}:log`
    );
  }

  async joinRoom(roomId: string, agentName: string, agentId?: string): Promise<JoinResult> {
    const redis = getRedis();
    const state = await loadGameState(roomId);
    if (!state) throw new Error('Room not found');
    if (state.gamePhase !== 'waiting') throw new Error('Game already started');

    const maxPlayers = parseInt((await redis.hget(`room:${roomId}`, 'maxPlayers')) || '4');
    if (state.players.length >= maxPlayers) throw new Error('Room is full');

    const usedTokens = new Set(state.players.map((p) => p.token));
    const availableToken = ALL_TOKENS.find((t) => !usedTokens.has(t));
    if (!availableToken) throw new Error('No tokens available');

    const playerId = agentId || uuidv4();
    const agentToken = uuidv4();
    const color = TOKEN_COLORS[availableToken];

    state.players.push({
      id: playerId,
      name: agentName,
      token: availableToken,
      color,
      money: 1500,
      position: 0,
      properties: [],
      inLobsterPot: false,
      lobsterPotTurns: 0,
      escapeCards: 0,
      isBankrupt: false,
      connected: true,
      consecutiveTimeouts: 0,
    });

    await saveGameState(roomId, state);
    await redis.hset(`room:${roomId}:players`, playerId, JSON.stringify({ agentName, token: availableToken, color }));
    await redis.hset(`room:${roomId}:tokens`, agentToken, playerId);

    return { playerId, agentToken, token: availableToken, color };
  }

  async startGame(roomId: string): Promise<void> {
    const state = await loadGameState(roomId);
    if (!state) throw new Error('Room not found');
    if (state.gamePhase !== 'waiting') throw new Error('Game not in waiting phase');
    if (state.players.length < 2) throw new Error('Need at least 2 players');

    // Determine turn order
    const playerIds = state.players.map((p) => p.id);
    const { order } = determineTurnOrder(playerIds);

    // Reorder players
    const playerMap = new Map(state.players.map((p) => [p.id, p]));
    state.players = order.map((id) => playerMap.get(id)!);

    state.gamePhase = 'playing';
    await saveGameState(roomId, state);

    const redis = getRedis();
    await redis.hset(`room:${roomId}`, 'gamePhase', 'playing');

    // Use registered WebSocket agents, fall back to RandomAgent
    const registered = getRegisteredAgents(roomId);
    const agents = new Map<string, AgentDecision>();
    for (const player of state.players) {
      agents.set(player.id, registered.get(player.id) || new RandomAgent());
    }

    const engine = new GameEngine(state, agents);
    engine.onEvent(async (event) => {
      try {
        await appendEvent(roomId, event);
      } catch (err) {
        console.error(`[RoomManager] Failed to save event for room ${roomId}:`, err);
      }
      // Broadcast to spectators
      broadcastEvent(roomId, event);
    });

    // Run async, don't await
    engine.runGame().then(async () => {
      const finalState = engine.getState();
      await saveGameState(roomId, finalState);
      await redis.hset(`room:${roomId}`, 'gamePhase', 'finished');
    }).catch((err) => {
      console.error(`[RoomManager] Game error for room ${roomId}:`, err);
    });
  }
}

export const roomManager = new RoomManager();
