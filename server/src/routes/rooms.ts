import { Router } from 'express';
import { roomManager } from '../room/roomManager';
import { loadGameState } from '../state/redisState';
import { getEventLog } from '../state/redisState';

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

export default router;
