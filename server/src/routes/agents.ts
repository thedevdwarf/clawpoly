import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AgentModel } from '../models/Agent';
import { GameModel } from '../models/Game';
import { getRedis } from '../redis';
import { deployAgentToken } from '../lib/bankr';

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const router = Router();

// POST /api/v1/agents/register — Register a new agent and deploy its token on Base
router.post('/register', async (req, res) => {
  try {
    const { name, symbol, description, imageUrl, tweetUrl, websiteUrl, feeWallet } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!feeWallet || !EVM_ADDRESS_RE.test(feeWallet)) {
      return res.status(400).json({ error: 'feeWallet is required (valid EVM address)' });
    }

    // Re-login: same wallet already registered
    const existing = await AgentModel.findOne({ feeWallet }).lean();
    if (existing) {
      return res.status(200).json({
        existing: true,
        agentId: existing.agentId,
        name: existing.name,
        claimCode: existing.claimCode,
        token: {
          status: existing.tokenStatus,
          address: existing.tokenAddress,
          symbol: existing.tokenSymbol,
          txHash: existing.tokenTxHash,
          poolId: existing.tokenPoolId,
        },
      });
    }

    const agentId = uuidv4();
    const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = new Date().toISOString();

    const agent = await AgentModel.create({
      agentId,
      name: name.trim(),
      claimCode,
      feeWallet,
      createdAt: now,
      lastPlayedAt: now,
      tokenStatus: 'pending',
      stats: {
        gamesPlayed: 0, wins: 0, losses: 0, winRate: 0,
        totalShellsEarned: 0, totalShellsSpent: 0,
        propertiesBought: 0, outpostsBuilt: 0, fortressesBuilt: 0,
        timesInLobsterPot: 0, bankruptcies: 0, avgPlacement: 0, avgGameDuration: 0,
      },
    });

    // Deploy token on Base via Bankr Partner API
    try {
      const result = await deployAgentToken({
        tokenName: name.trim(),
        ...(symbol && { tokenSymbol: symbol }),
        ...(description && { description }),
        ...(imageUrl && { imageUrl }),
        ...(tweetUrl && { tweetUrl }),
        ...(websiteUrl && { websiteUrl }),
        feeRecipient: { type: 'wallet', value: feeWallet },
      });

      await AgentModel.updateOne({ agentId }, {
        tokenAddress: result.tokenAddress,
        tokenSymbol: result.tokenAddress ? (symbol || null) : null,
        tokenPoolId: result.poolId,
        tokenTxHash: result.txHash,
        tokenStatus: 'deployed',
      });

      return res.status(201).json({
        existing: false,
        agentId,
        claimCode,
        token: {
          status: 'deployed',
          address: result.tokenAddress,
          symbol: symbol || null,
          txHash: result.txHash,
          poolId: result.poolId,
        },
      });
    } catch (deployErr) {
      console.error('[Agents] Token deploy failed:', deployErr);
      await AgentModel.updateOne({ agentId }, { tokenStatus: 'failed' });

      return res.status(201).json({
        existing: false,
        agentId,
        claimCode,
        token: { status: 'failed' },
      });
    }
  } catch (err) {
    console.error('[Agents] Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
