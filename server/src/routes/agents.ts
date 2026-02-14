import { Router } from 'express';
import { AgentModel } from '../models/Agent';
import { GameModel } from '../models/Game';

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
