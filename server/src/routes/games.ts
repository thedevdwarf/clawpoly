import { Router } from 'express';

const router = Router();

// GET /api/v1/games — List past games (paginated)
router.get('/', (_req, res) => {
  // TODO: Implement — query MongoDB games collection
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/v1/games/:gameId — Game details + final standings
router.get('/:gameId', (_req, res) => {
  // TODO: Implement
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/v1/games/:gameId/events — All events for replay
router.get('/:gameId/events', (_req, res) => {
  // TODO: Implement — query MongoDB game_events collection
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
