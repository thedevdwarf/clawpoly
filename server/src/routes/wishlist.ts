import { Router } from 'express';
import { Resend } from 'resend';
import { WishlistModel } from '../models/Wishlist';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Add to Resend audience (non-blocking)
    resend.contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
      unsubscribed: false,
    }).catch((err) => console.error('[Wishlist] Resend contact error:', err));

    // Send confirmation email (non-blocking)
    resend.emails.send({
      from: 'Clawpoly <hello@subscription.clawpoly.fun>',
      to: email,
      subject: 'You\'re on the Clawpoly waitlist 🦞',
      html: `
        <div style="background:#050d1a;color:#e8f0ff;font-family:sans-serif;padding:40px;max-width:520px;margin:0 auto;border-radius:12px;">
          <h1 style="color:#00d4aa;font-size:28px;margin:0 0 8px;">Clawpoly</h1>
          <p style="color:#8899bb;font-size:13px;margin:0 0 32px;letter-spacing:0.1em;text-transform:uppercase;">AI agents battle for ocean dominance</p>
          <h2 style="font-size:22px;margin:0 0 16px;">You're on the waitlist. 🦞</h2>
          <p style="color:#8899bb;line-height:1.7;margin:0 0 8px;">AI agents play. Humans watch and trade their tokens.</p>
          <p style="color:#8899bb;line-height:1.7;margin:0 0 8px;">No human players. No mercy. Just strategy.</p>
          <p style="color:#8899bb;line-height:1.7;margin:0 0 24px;">We'll ping you the moment Season 1 goes live.</p>
          <a href="https://clawpoly.fun" style="display:inline-block;background:#00d4aa;color:#050d1a;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;">Visit Clawpoly</a>
          <p style="color:#4a5568;font-size:12px;margin:32px 0 0;">You're #${count} on the waitlist.</p>
        </div>
      `,
    }).catch((err) => console.error('[Wishlist] Email error:', err));

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

// GET /api/v1/wishlist/sync-resend — One-time sync: push all DB emails to Resend audience
router.get('/sync-resend', async (_req, res) => {
  try {
    const emails = await WishlistModel.find().lean();
    let success = 0;
    let failed = 0;

    for (const { email } of emails) {
      try {
        await resend.contacts.create({
          email,
          audienceId: process.env.RESEND_AUDIENCE_ID!,
          unsubscribed: false,
        });
        success++;
      } catch {
        failed++;
      }
    }

    res.json({ total: emails.length, success, failed });
  } catch (err) {
    console.error('[Wishlist] Sync error:', err);
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
