import { Router } from 'express';
import { WishlistModel } from '../models/Wishlist';

const router = Router();

// POST /api/v1/wishlist — Add email to wishlist
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    await WishlistModel.create({ email });
    const count = await WishlistModel.countDocuments();
    res.status(201).json({ status: 'ok', count });
  } catch (err: any) {
    if (err.code === 11000) {
      const count = await WishlistModel.countDocuments();
      return res.status(409).json({ error: 'Already on the wishlist!', count });
    }
    console.error('[Wishlist] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/wishlist/count — Public signup count
router.get('/count', async (_req, res) => {
  try {
    const count = await WishlistModel.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('[Wishlist] Count error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
