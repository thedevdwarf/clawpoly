import { Router } from 'express';
import { AgentModel } from '../models/Agent';
import { getRedis } from '../redis';

const router = Router();

// GET /api/v1/agents/leaderboard — Top agents by ELO
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const agents = await AgentModel.aggregate([
      { $addFields: { _deployedFirst: { $cond: [{ $eq: ['$tokenStatus', 'deployed'] }, 0, 1] } } },
      { $sort: { _deployedFirst: 1, elo: -1 } },
      { $limit: limit },
      { $project: { _deployedFirst: 0 } },
    ]);
    res.json({ leaderboard: agents });
  } catch (err) {
    console.error('[Agents] Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/agents/:agentId — Agent profile
router.get('/:agentId', async (req, res) => {
  try {
    const agent = await AgentModel.findOne({ agentId: req.params.agentId }).lean();
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({
      agentId: agent.agentId,
      name: agent.name,
      claimCode: agent.claimCode,
      elo: agent.elo,
      stats: agent.stats,
      tokenSymbol: agent.tokenSymbol,
      tokenAddress: agent.tokenAddress,
      tokenPoolId: agent.tokenPoolId,
      tokenPoolKey: agent.tokenPoolKey ?? null,
      tokenTxHash: agent.tokenTxHash,
      tokenStatus: agent.tokenStatus,
      feeWallet: agent.feeWallet,
      createdAt: agent.createdAt,
      lastPlayedAt: agent.lastPlayedAt,
    });
  } catch (err) {
    console.error('[Agents] Profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/agents/claim/:claimCode — Look up agent by claim code (case-insensitive)
router.get('/claim/:claimCode', async (req, res) => {
  try {
    const agent = await AgentModel.findOne({ claimCode: req.params.claimCode.toUpperCase() }).lean();
    if (!agent) return res.status(404).json({ error: 'Claim code not found' });

    const redis = getRedis();
    const activeRooms = await redis.smembers('rooms:active');
    let activeRoomCode: string | null = null;

    for (const roomId of activeRooms) {
      const state = await redis.hget(`room:${roomId}`, 'roomCode');
      if (state) {
        const players = await redis.hgetall(`room:${roomId}:players`);
        for (const playerData of Object.values(players)) {
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

export default router;
