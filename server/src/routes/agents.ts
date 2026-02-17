import { Router } from 'express';
import { AgentModel } from '../models/Agent';
import { GameModel } from '../models/Game';
import { getRedis } from '../redis';

const router = Router();

// GET /api/v1/leaderboard — Top agents by ELO
// NOTE: This must be before /:agentId to avoid matching "leaderboard" as an agentId
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const agents = await AgentModel.find().sort({ elo: -1 }).limit(limit).lean();
    res.json({ leaderboard: agents });
  } catch (err) {
    console.error('[Agents] Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/agents — List all known agents
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [agents, total] = await Promise.all([
      AgentModel.find().sort({ elo: -1 }).skip(skip).limit(limit).lean(),
      AgentModel.countDocuments(),
    ]);

    res.json({ agents, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Agents] List error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/agents/claim/:claimCode — Look up agent by claim code (case-insensitive)
router.get('/claim/:claimCode', async (req, res) => {
  try {
    const agent = await AgentModel.findOne({ claimCode: req.params.claimCode.toUpperCase() }).lean();
    if (!agent) return res.status(404).json({ error: 'Claim code not found' });

    // Check if agent is in an active game
    const redis = getRedis();
    const activeRooms = await redis.smembers('rooms:active');
    let activeRoomCode: string | null = null;

    for (const roomId of activeRooms) {
      const state = await redis.hget(`room:${roomId}`, 'roomCode');
      if (state) {
        // Check if this agent is playing in this room
        // This is a simple check - in production, we'd need to track agent → room mappings
        const playersKey = `room:${roomId}:players`;
        const players = await redis.hgetall(playersKey);
        for (const [playerId, playerData] of Object.entries(players)) {
          const parsed = JSON.parse(playerData);
          if (parsed.agentName === agent.name) {
            activeRoomCode = state;
            break;
          }
        }
      }
      if (activeRoomCode) break;
    }

    res.json({
      agentId: agent.agentId,
      name: agent.name,
      claimCode: agent.claimCode,
      coachId: agent.coachId,
      createdAt: agent.createdAt,
      lastPlayedAt: agent.lastPlayedAt,
      elo: agent.elo,
      gamesPlayed: agent.stats?.gamesPlayed || 0,
      wins: agent.stats?.wins || 0,
      losses: agent.stats?.losses || 0,
      winRate: agent.stats?.winRate || 0,
      activeRoomCode,
    });
  } catch (err) {
    console.error('[Agents] Claim error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/agents/:agentId — Agent profile + stats
router.get('/:agentId', async (req, res) => {
  try {
    const agent = await AgentModel.findOne({ agentId: req.params.agentId }).lean();
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) {
    console.error('[Agents] Detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/agents/:agentId/games — Agent's game history
router.get('/:agentId/games', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [games, total] = await Promise.all([
      GameModel.find({ 'players.id': req.params.agentId })
        .sort({ finishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GameModel.countDocuments({ 'players.id': req.params.agentId }),
    ]);

    res.json({ games, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Agents] Games error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
