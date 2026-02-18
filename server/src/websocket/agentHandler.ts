import WebSocket from 'ws';
import { getRedis } from '../redis';
import { loadGameState } from '../state/redisState';
import { config } from '../config';
import { AgentDecision, BuildDecision } from '../types/agent';
import { Player } from '../types/player';
import { Square } from '../types/square';
import { GameState } from '../types/game';
import { WSMessage } from '../types/messages';
import { roomManager, registerAgent } from '../room/roomManager';

function sendMessage(ws: WebSocket, type: string, data: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    const msg: WSMessage = { type, data, timestamp: new Date().toISOString() };
    ws.send(JSON.stringify(msg));
  }
}

export class WebSocketAgent implements AgentDecision {
  private ws: WebSocket;
  private pendingDecision: {
    resolve: (value: unknown) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  } | null = null;
  public playerId: string;
  public roomId: string;
  private disconnected = false;
  private graceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(ws: WebSocket, playerId: string, roomId: string) {
    this.ws = ws;
    this.playerId = playerId;
    this.roomId = roomId;
  }

  replaceSocket(ws: WebSocket): void {
    this.ws = ws;
    this.disconnected = false;
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
  }

  markDisconnected(): void {
    this.disconnected = true;
    this.graceTimer = setTimeout(() => {
      // Grace expired — resolve any pending with default
      this.disconnected = true;
    }, config.agentDisconnectGraceMs);
  }

  isDisconnected(): boolean {
    return this.disconnected;
  }

  send(type: string, data: Record<string, unknown>): void {
    sendMessage(this.ws, type, data);
  }

  private requestDecision<T>(type: string, data: Record<string, unknown>, defaultValue: T): Promise<T> {
    return new Promise<T>((resolve) => {
      // If disconnected, return default immediately
      if (this.disconnected) {
        resolve(defaultValue);
        return;
      }

      const timeoutId = setTimeout(() => {
        if (this.pendingDecision) {
          this.pendingDecision = null;
          resolve(defaultValue);
        }
      }, config.agentTimeoutMs);

      this.pendingDecision = { resolve: resolve as (v: unknown) => void, timeoutId };
      this.send(type, data);
    });
  }

  resolveDecision(value: unknown): void {
    if (this.pendingDecision) {
      clearTimeout(this.pendingDecision.timeoutId);
      const { resolve } = this.pendingDecision;
      this.pendingDecision = null;
      resolve(value);
    }
  }

  async decideBuy(player: Player, square: Square, _state: GameState): Promise<boolean> {
    return this.requestDecision('agent:buy_decision', {
      property: { name: square.name, index: square.index, price: square.price, colorGroup: square.colorGroup },
      yourMoney: player.money,
    }, false);
  }

  async decideBuild(
    player: Player,
    buildableSquares: number[],
    upgradeableSquares: number[],
    state: GameState
  ): Promise<BuildDecision | null> {
    return this.requestDecision('agent:build_decision', {
      buildableSquares: buildableSquares.map((idx) => ({
        index: idx,
        name: state.board[idx].name,
        outpostCost: state.board[idx].outpostCost,
        outposts: state.board[idx].outposts,
      })),
      upgradeableSquares: upgradeableSquares.map((idx) => ({
        index: idx,
        name: state.board[idx].name,
        fortressCost: state.board[idx].fortressCost,
      })),
      yourMoney: player.money,
    }, null);
  }

  async decideLobsterPot(player: Player, _state: GameState): Promise<'pay' | 'card' | 'roll'> {
    return this.requestDecision('agent:lobster_pot_decision', {
      turnsTrapped: player.lobsterPotTurns,
      hasEscapeCard: player.escapeCards.length > 0,
      yourMoney: player.money,
    }, 'roll');
  }
}

// Track connected agents for reconnection
const connectedAgents = new Map<string, WebSocketAgent>(); // key: `${roomId}:${playerId}`

export function getConnectedAgent(roomId: string, playerId: string): WebSocketAgent | undefined {
  return connectedAgents.get(`${roomId}:${playerId}`);
}

export async function handleAgentConnection(ws: WebSocket, roomId: string, agentToken: string): Promise<void> {
  const redis = getRedis();

  // Validate token
  const playerId = await redis.hget(`room:${roomId}:tokens`, agentToken);
  if (!playerId) {
    sendMessage(ws, 'error', { code: 'INVALID_TOKEN', message: 'Invalid agent token' });
    ws.close(4001, 'Invalid agent token');
    return;
  }

  // Check room exists
  const roomData = await redis.hgetall(`room:${roomId}`);
  if (!roomData || !roomData.roomId) {
    sendMessage(ws, 'error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
    ws.close(4004, 'Room not found');
    return;
  }

  const agentKey = `${roomId}:${playerId}`;

  // Check for reconnection
  const existingAgent = connectedAgents.get(agentKey);
  if (existingAgent) {
    existingAgent.replaceSocket(ws);
    sendMessage(ws, 'agent:welcome', {
      playerId,
      roomId,
      reconnected: true,
      gameConfig: {
        maxPlayers: parseInt(roomData.maxPlayers || '4'),
        gameSpeed: roomData.gameSpeed || 'normal',
        turnLimit: parseInt(roomData.turnLimit || '200'),
      },
    });
    console.log(`[Agent] Player ${playerId} reconnected to room ${roomId}`);
  } else {
    const agent = new WebSocketAgent(ws, playerId, roomId);
    connectedAgents.set(agentKey, agent);
    registerAgent(roomId, playerId, agent);

    sendMessage(ws, 'agent:welcome', {
      playerId,
      roomId,
      gameConfig: {
        maxPlayers: parseInt(roomData.maxPlayers || '4'),
        gameSpeed: roomData.gameSpeed || 'normal',
        turnLimit: parseInt(roomData.turnLimit || '200'),
      },
    });
    console.log(`[Agent] Player ${playerId} connected to room ${roomId}`);
  }

  // Update connected status in game state
  const state = await loadGameState(roomId);
  if (state) {
    const player = state.players.find((p) => p.id === playerId);
    if (player) {
      player.connected = true;
    }
  }

  // Handle messages
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as WSMessage;
      const agent = connectedAgents.get(agentKey);
      if (!agent) return;

      switch (msg.type) {
        case 'action:buy':
          agent.resolveDecision(true);
          break;
        case 'action:pass':
          agent.resolveDecision(false);
          break;
        case 'action:build':
          agent.resolveDecision({
            squareIndex: (msg.data as Record<string, unknown>).squareIndex as number,
            action: 'build' as const,
          });
          break;
        case 'action:upgrade':
          agent.resolveDecision({
            squareIndex: (msg.data as Record<string, unknown>).squareIndex as number,
            action: 'upgrade' as const,
          });
          break;
        case 'action:skip_build':
          agent.resolveDecision(null);
          break;
        case 'action:escape_pay':
          agent.resolveDecision('pay');
          break;
        case 'action:escape_card':
          agent.resolveDecision('card');
          break;
        case 'action:escape_roll':
          agent.resolveDecision('roll');
          break;
        default:
          sendMessage(ws, 'error', { code: 'INVALID_ACTION', message: `Unknown action: ${msg.type}` });
      }
    } catch {
      sendMessage(ws, 'error', { code: 'INVALID_ACTION', message: 'Invalid JSON' });
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    const agent = connectedAgents.get(agentKey);
    if (agent) {
      agent.markDisconnected();
      console.log(`[Agent] Player ${playerId} disconnected from room ${roomId}`);
      // Broadcast disconnect to spectators
      broadcastToSpectators(roomId, 'room:player_disconnected', { playerId });
    }
  });

  ws.on('error', (err) => {
    console.error(`[Agent] WebSocket error for player ${playerId}:`, err.message);
  });
}

// Import at bottom to avoid circular dependency
import { broadcastToSpectators } from './spectatorHandler';
