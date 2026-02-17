import { Router } from 'express';
import { roomManager, registerAgent } from '../room/roomManager';
import { loadGameState, saveGameState } from '../state/redisState';
import { getEventLog } from '../state/redisState';
import { getRedis } from '../redis';
import { v4 as uuidv4 } from 'uuid';
import { TOKEN_COLORS } from '../types/player';
import { RandomAgent } from '../engine/agents/randomAgent';
import { AgentModel } from '../models/Agent';
import { getOrCreateMcpAgent, setAgentRoom } from '../engine/agents/mcpAgent';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { name, maxPlayers, turnLimit, gameSpeed } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const room = await roomManager.createRoom(name, { maxPlayers, turnLimit, gameSpeed });
    res.status(201).json({
      id: room.roomId,
      roomCode: room.roomCode,
      name: room.roomName,
      status: 'waiting',
      playerCount: 0,
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (_req, res) => {
  try {
    const rooms = await roomManager.listRooms();
    const transformed = await Promise.all(rooms.map(async (room) => {
      const state = await loadGameState(room.roomId);
      return {
        id: room.roomId,
        roomCode: room.roomCode,
        name: room.roomName,
        status: room.gamePhase,
        playerCount: state?.players.length ?? 0,
        maxPlayers: parseInt(room.maxPlayers) || 4,
        createdAt: room.createdAt,
      };
    }));
    res.json({ rooms: transformed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', async (_req, res) => {
  try {
    const rooms = await roomManager.listRooms();
    let deleted = 0;
    for (const room of rooms) {
      await roomManager.deleteRoom(room.roomId);
      deleted++;
    }
    res.json({ status: 'deleted', count: deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:roomId', async (req, res) => {
  try {
    const room = await roomManager.getRoom(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const state = await loadGameState(req.params.roomId);
    const players = state?.players.map((p) => ({ id: p.id, name: p.name, token: p.token, color: p.color })) || [];
    res.json({
      id: room.roomId,
      roomCode: room.roomCode,
      name: room.roomName,
      status: room.gamePhase,
      playerCount: players.length,
      maxPlayers: parseInt(room.maxPlayers) || 4,
      createdAt: room.createdAt,
      players,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:roomId/join', async (req, res) => {
  try {
    const { agentName, agentId } = req.body;
    if (!agentName) return res.status(400).json({ error: 'agentName is required' });
    const result = await roomManager.joinRoom(req.params.roomId, agentName, agentId);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'Room not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Room is full' || err.message === 'Game already started') return res.status(409).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.post('/:roomId/start', async (req, res) => {
  try {
    await roomManager.startGame(req.params.roomId);
    res.json({ status: 'started' });
  } catch (err: any) {
    if (err.message === 'Room not found') return res.status(404).json({ error: err.message });
    if (err.message.includes('Need at least') || err.message.includes('not in waiting')) return res.status(409).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:roomId', async (req, res) => {
  try {
    const room = await roomManager.getRoom(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.gamePhase !== 'waiting' && room.gamePhase !== 'finished') {
      return res.status(409).json({ error: 'Can only delete rooms in waiting or finished state' });
    }
    await roomManager.deleteRoom(req.params.roomId);
    res.json({ status: 'deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:roomId/state', async (req, res) => {
  try {
    const state = await loadGameState(req.params.roomId);
    if (!state) return res.status(404).json({ error: 'Room not found' });
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:roomId/log', async (req, res) => {
  try {
    const from = parseInt(req.query.from as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;
    const events = await getEventLog(req.params.roomId, from, limit);
    res.json({ events, from, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/rooms/:roomId/add-bots — Add mock RandomAgents to fill the room
router.post('/:roomId/add-bots', async (req, res) => {
  try {
    const { count = 3 } = req.body;
    const state = await loadGameState(req.params.roomId);
    if (!state) return res.status(404).json({ error: 'Room not found' });
    if (state.gamePhase !== 'waiting') return res.status(409).json({ error: 'Game already started' });

    // Get maxPlayers from Redis
    const redis = getRedis();
    const maxPlayers = parseInt((await redis.hget(`room:${req.params.roomId}`, 'maxPlayers')) || '4');
    const currentPlayers = state.players.length;
    const availableSlots = maxPlayers - currentPlayers;
    const botsToAdd = Math.min(count, availableSlots);

    if (botsToAdd <= 0) {
      return res.json({ message: 'Room is full', added: 0 });
    }

    const ALL_TOKENS: Array<'lobster' | 'crab' | 'octopus' | 'seahorse' | 'dolphin' | 'shark'> =
      ['lobster', 'crab', 'octopus', 'seahorse', 'dolphin', 'shark'];

    const usedTokens = new Set(state.players.map((p) => p.token));
    const botNames = ['Reef Bot', 'Abyss Bot', 'Tidal Bot', 'Ocean Bot'];

    let added = 0;
    for (let i = 0; i < botsToAdd; i++) {
      const availableToken = ALL_TOKENS.find((t) => !usedTokens.has(t));
      if (!availableToken) break;

      const botName = `${botNames[i % botNames.length]} ${Math.floor(Math.random() * 1000)}`;
      const playerId = uuidv4();
      const color = TOKEN_COLORS[availableToken];

      state.players.push({
        id: playerId,
        name: botName,
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

      // Register RandomAgent for this player
      registerAgent(req.params.roomId, playerId, new RandomAgent());
      usedTokens.add(availableToken);
      added++;
    }

    await saveGameState(req.params.roomId, state);

    res.json({ message: `Added ${added} mock bot(s)`, added, totalPlayers: state.players.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Start matchmade game (from queue.ts logic)
async function startMatchmadeGame(agentIds: string[]): Promise<{ roomCode: string; roomId: string }> {
  const QUEUE_MIN_PLAYERS = 4;

  // Create a room
  const room = await roomManager.createRoom('Matchmade Game', {
    maxPlayers: QUEUE_MIN_PLAYERS,
    gameSpeed: 'normal',
    turnLimit: 200,
  });

  // Join each agent to the room and register appropriate agents
  for (const agentId of agentIds) {
    const agentDoc = await AgentModel.findOne({ agentId }).lean();
    if (!agentDoc) continue;

    const joinResult = await roomManager.joinRoom(room.roomId, agentDoc.name, agentId);

    // If it's a real MCP agent, register it; otherwise use RandomAgent
    if (agentDoc.agentToken) {
      const mcpAgent = getOrCreateMcpAgent(agentId, agentDoc.agentToken);
      mcpAgent.roomId = room.roomId;
      setAgentRoom(agentId, room.roomId);
      registerAgent(room.roomId, joinResult.playerId, mcpAgent);
    } else {
      registerAgent(room.roomId, joinResult.playerId, new RandomAgent());
    }
  }

  // Start the game
  await roomManager.startGame(room.roomId);

  console.log(`[Queue] Matchmade game started: room ${room.roomCode} (${room.roomId})`);
  return { roomCode: room.roomCode, roomId: room.roomId };
}

// POST /api/v1/queue/add-mock — Add mock agents to matchmaking queue
router.post('/queue/add-mock', async (req, res) => {
  try {
    const { count = 3 } = req.body;
    const redis = getRedis();
    const QUEUE_KEY = 'queue:waiting';

    const botNames = ['Reef Bot', 'Abyss Bot', 'Tidal Bot', 'Ocean Bot'];
    let added = 0;

    for (let i = 0; i < count; i++) {
      const agentId = uuidv4();
      const agentToken = uuidv4();
      const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const now = new Date().toISOString();

      // Create mock agent in MongoDB
      await AgentModel.create({
        agentId,
        name: `${botNames[i % botNames.length]} ${Math.floor(Math.random() * 1000)}`,
        agentToken,
        claimCode,
        coachId: null,
        createdAt: now,
        lastPlayedAt: now,
        elo: 1000 + Math.floor(Math.random() * 200), // Random ELO 1000-1200
        stats: {
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          totalShellsEarned: 0,
          totalShellsSpent: 0,
          propertiesBought: 0,
          outpostsBuilt: 0,
          fortressesBuilt: 0,
          timesInLobsterPot: 0,
          bankruptcies: 0,
          avgPlacement: 0,
          avgGameDuration: 0,
        },
      });

      // Add to queue
      const score = Date.now();
      await redis.zadd(QUEUE_KEY, score, agentId);
      added++;

      console.log(`[Queue] Mock agent added to queue (${added}/${count})`);
    }

    const queueSize = await redis.zcard(QUEUE_KEY);
    const QUEUE_MIN_PLAYERS = 4;

    // Start game if queue is full
    if (queueSize >= QUEUE_MIN_PLAYERS) {
      const agentIds = await redis.zrange(QUEUE_KEY, 0, QUEUE_MIN_PLAYERS - 1);
      await redis.zrem(QUEUE_KEY, ...agentIds);

      const { roomCode } = await startMatchmadeGame(agentIds);

      return res.json({
        message: `Added ${added} mock agent(s) and started game`,
        added,
        queueSize: queueSize - QUEUE_MIN_PLAYERS,
        roomCode,
        gameStarted: true,
      });
    }

    res.json({
      message: `Added ${added} mock agent(s) to queue`,
      added,
      queueSize,
      waiting: QUEUE_MIN_PLAYERS - queueSize,
      willStartGame: queueSize >= QUEUE_MIN_PLAYERS,
    });
  } catch (err: any) {
    console.error('[Queue] Add mock error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
