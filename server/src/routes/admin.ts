import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { adminAuth } from '../middleware/adminAuth';
import { roomManager, registerAgent } from '../room/roomManager';
import { loadGameState, saveGameState } from '../state/redisState';
import { AgentModel } from '../models/Agent';
import { GameModel } from '../models/Game';
import { RandomAgent } from '../engine/agents/randomAgent';
import { TOKEN_COLORS } from '../types/player';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/v1/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { role: 'admin' },
    process.env.ADMIN_JWT_SECRET || 'secret',
    { expiresIn: '24h' }
  );
  res.json({ token });
});

// GET /api/v1/admin/stats
router.get('/stats', adminAuth, async (_req, res) => {
  try {
    const rooms = await roomManager.listRooms();
    const activeRooms = rooms.filter((r) => r.gamePhase === 'playing').length;
    const [agentCount, gameCount] = await Promise.all([
      AgentModel.countDocuments(),
      GameModel.countDocuments(),
    ]);
    res.json({
      totalRooms: rooms.length,
      activeRooms,
      totalAgents: agentCount,
      totalGames: gameCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/admin/rooms
router.get('/rooms', adminAuth, async (_req, res) => {
  try {
    const rooms = await roomManager.listRooms();
    const detailed = await Promise.all(
      rooms.map(async (room) => {
        const state = await loadGameState(room.roomId);
        return {
          id: room.roomId,
          roomCode: room.roomCode,
          name: room.roomName,
          status: room.gamePhase,
          playerCount: state?.players.length ?? 0,
          maxPlayers: parseInt(room.maxPlayers) || 4,
          turnNumber: state?.turnNumber ?? 0,
          createdAt: room.createdAt,
          players: state?.players.map((p) => ({
            name: p.name,
            token: p.token,
            money: p.money,
            isBankrupt: p.isBankrupt,
          })) ?? [],
        };
      })
    );
    res.json({ rooms: detailed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/admin/rooms — create room
router.post('/rooms', adminAuth, async (req, res) => {
  try {
    const { name = 'Admin Room', maxPlayers = 4, turnLimit = 200, gameSpeed = 'normal' } = req.body;
    const room = await roomManager.createRoom(name, { maxPlayers, turnLimit, gameSpeed });
    res.status(201).json({
      id: room.roomId,
      roomCode: room.roomCode,
      name: room.roomName,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/admin/rooms/:roomId/add-bots
router.post('/rooms/:roomId/add-bots', adminAuth, async (req, res) => {
  try {
    const roomId = req.params.roomId as string;
    const { count = 4 } = req.body;
    const state = await loadGameState(roomId);
    if (!state) return res.status(404).json({ error: 'Room not found' });
    if (state.gamePhase !== 'waiting') return res.status(409).json({ error: 'Game already started' });

    const ALL_TOKENS: Array<'lobster' | 'crab' | 'octopus' | 'seahorse' | 'dolphin' | 'shark'> =
      ['lobster', 'crab', 'octopus', 'seahorse', 'dolphin', 'shark'];
    const usedTokens = new Set(state.players.map((p) => p.token));
    const botNames = ['Reef Bot', 'Abyss Bot', 'Tidal Bot', 'Ocean Bot', 'Depth Bot', 'Wave Bot'];
    const maxPlayers = 4;
    const available = maxPlayers - state.players.length;
    const toAdd = Math.min(count, available);

    let added = 0;
    for (let i = 0; i < toAdd; i++) {
      const token = ALL_TOKENS.find((t) => !usedTokens.has(t));
      if (!token) break;
      const playerId = uuidv4();
      state.players.push({
        id: playerId,
        name: `${botNames[i % botNames.length]} ${Math.floor(Math.random() * 1000)}`,
        token,
        color: TOKEN_COLORS[token],
        money: 1500,
        position: 0,
        properties: [],
        inLobsterPot: false,
        lobsterPotTurns: 0,
        escapeCards: [],
        isBankrupt: false,
        connected: true,
        consecutiveTimeouts: 0,
      });
      registerAgent(roomId, playerId, new RandomAgent());
      usedTokens.add(token);
      added++;
    }

    await saveGameState(roomId, state);
    res.json({ added, totalPlayers: state.players.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/admin/rooms/:roomId/start
router.post('/rooms/:roomId/start', adminAuth, async (req, res) => {
  try {
    await roomManager.startGame(req.params.roomId as string);
    res.json({ status: 'started' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/v1/admin/rooms/:roomId
router.delete('/rooms/:roomId', adminAuth, async (req, res) => {
  try {
    const roomId = req.params.roomId as string;
    const room = await roomManager.getRoom(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    await roomManager.deleteRoom(roomId);
    res.json({ status: 'deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/admin/agents
router.get('/agents', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const agents = await AgentModel.find()
      .sort({ elo: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await AgentModel.countDocuments();
    res.json({
      agents: agents.map((a) => ({
        id: a.agentId,
        name: a.name,
        elo: a.elo,
        gamesPlayed: a.stats.gamesPlayed,
        wins: a.stats.wins,
        winRate: a.stats.winRate,
        createdAt: a.createdAt,
      })),
      total,
      page,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/admin/stress-test
router.post('/stress-test', adminAuth, async (req, res) => {
  const { count = 5, speed = 'instant' } = req.body;
  const total = Math.min(Math.max(1, parseInt(count)), 200);

  const ALL_TOKENS: Array<'lobster' | 'crab' | 'octopus' | 'seahorse' | 'dolphin' | 'shark'> =
    ['lobster', 'crab', 'octopus', 'seahorse', 'dolphin', 'shark'];
  const BOT_NAMES = ['Reef Bot', 'Abyss Bot', 'Tidal Bot', 'Ocean Bot'];

  let started = 0;
  const errors: string[] = [];

  const launchOne = async (i: number) => {
    try {
      const room = await roomManager.createRoom(`Stress #${i + 1}`, {
        maxPlayers: 4,
        turnLimit: 200,
        gameSpeed: speed,
      });

      const state = await loadGameState(room.roomId);
      if (!state) return;

      const usedTokens = new Set<string>();
      for (let j = 0; j < 4; j++) {
        const token = ALL_TOKENS.find((t) => !usedTokens.has(t))!;
        const playerId = uuidv4();
        state.players.push({
          id: playerId,
          name: `${BOT_NAMES[j]} ${Math.floor(Math.random() * 1000)}`,
          token,
          color: TOKEN_COLORS[token],
          money: 1500,
          position: 0,
          properties: [],
          inLobsterPot: false,
          lobsterPotTurns: 0,
          escapeCards: [],
          isBankrupt: false,
          connected: true,
          consecutiveTimeouts: 0,
        });
        registerAgent(room.roomId, playerId, new RandomAgent());
        usedTokens.add(token);
      }

      await saveGameState(room.roomId, state);
      await roomManager.startGame(room.roomId);
      started++;
    } catch (err: any) {
      errors.push(err.message);
    }
  };

  // Launch in batches of 10 to avoid overwhelming the event loop
  const batchSize = 10;
  for (let i = 0; i < total; i += batchSize) {
    const batch = [];
    for (let j = i; j < Math.min(i + batchSize, total); j++) {
      batch.push(launchOne(j));
    }
    await Promise.all(batch);
  }

  res.json({ requested: total, started, errors: errors.slice(0, 10) });
});

export default router;
