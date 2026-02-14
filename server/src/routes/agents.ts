import { Router } from 'express';

const router = Router();

// GET /api/v1/agents — List all known agents
router.get('/', (_req, res) => {
  // TODO: Implement — query MongoDB agents collection
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/v1/agents/:agentId — Agent profile + stats
router.get('/:agentId', (_req, res) => {
  // TODO: Implement
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/v1/agents/:agentId/games — Agent's game history
router.get('/:agentId/games', (_req, res) => {
  // TODO: Implement
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/v1/leaderboard — Global leaderboard (by ELO)
router.get('/leaderboard', (_req, res) => {
  // TODO: Implement — query MongoDB leaderboard collection
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
