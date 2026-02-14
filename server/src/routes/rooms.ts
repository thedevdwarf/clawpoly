import { Router } from 'express';

const router = Router();

// POST /api/v1/rooms — Create a new game room
router.post('/', (_req, res) => {
  // TODO: Implement room creation
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/v1/rooms — List available rooms
router.get('/', (_req, res) => {
  // TODO: Implement room listing
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/v1/rooms/:roomId — Get room details + state
router.get('/:roomId', (_req, res) => {
  // TODO: Implement room details
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/v1/rooms/:roomId/start — Start the game
router.post('/:roomId/start', (_req, res) => {
  // TODO: Implement game start
  res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/v1/rooms/:roomId — Destroy a room
router.delete('/:roomId', (_req, res) => {
  // TODO: Implement room deletion
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/v1/rooms/:roomId/state — Full game state snapshot
router.get('/:roomId/state', (_req, res) => {
  // TODO: Implement state snapshot
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/v1/rooms/:roomId/log — Game event log
router.get('/:roomId/log', (_req, res) => {
  // TODO: Implement event log
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
