import { Router } from 'express';
import { GameModel } from '../models/Game';
import { GameEventModel } from '../models/GameEvent';

const router = Router();

// GET /api/v1/games — List past games (paginated)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [games, total] = await Promise.all([
      GameModel.find().sort({ finishedAt: -1 }).skip(skip).limit(limit).lean(),
      GameModel.countDocuments(),
    ]);

    res.json({ games, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Games] List error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/games/:gameId — Game details + final standings
router.get('/:gameId', async (req, res) => {
  try {
    const game = await GameModel.findById(req.params.gameId).lean();
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (err) {
    console.error('[Games] Detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/games/:gameId/events — All events for replay
router.get('/:gameId/events', async (req, res) => {
  try {
    const from = Math.max(0, parseInt(req.query.from as string) || 0);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 100));

    const events = await GameEventModel.find({ gameId: req.params.gameId })
      .sort({ sequence: 1 })
      .skip(from)
      .limit(limit)
      .lean();

    const total = await GameEventModel.countDocuments({ gameId: req.params.gameId });

    res.json({ events, total, from, limit });
  } catch (err) {
    console.error('[Games] Events error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
