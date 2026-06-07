import express from 'express';
import Cart from '../models/Cart.js';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyIdTokenFromReq(req) {
  // Accept Authorization: Bearer <id_token> or idToken in body/query
  const auth = req.headers && req.headers.authorization;
  let idToken = null;
  if (auth && auth.startsWith('Bearer ')) idToken = auth.slice(7).trim();
  if (!idToken && req.body && req.body.idToken) idToken = req.body.idToken;
  if (!idToken && req.query && req.query.idToken) idToken = req.query.idToken;
  if (!idToken) return null;
  try {
    const ticket = await oauthClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID || undefined });
    const payload = ticket.getPayload();
    return payload;
  } catch (e) {
    console.warn('ID token verify failed', e && e.message);
    return null;
  }
}

// Save or replace user's cart (requires valid Google ID token)
router.post('/save', async (req, res) => {
  try {
    const payload = await verifyIdTokenFromReq(req);
    if (!payload || !payload.email) return res.status(401).json({ message: 'Invalid or missing ID token' });
    const userEmail = payload.email;
    const items = req.body.items || [];

    const doc = await Cart.findOneAndUpdate(
      { userEmail },
      { $set: { items, updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    res.json({ ok: true, userEmail, cart: doc });
  } catch (err) {
    console.error('[POST /api/cart/save] error', err && err.message);
    res.status(500).json({ message: 'Failed to save cart', error: err.message });
  }
});

// Load user's cart (requires valid Google ID token)
router.get('/load', async (req, res) => {
  try {
    const payload = await verifyIdTokenFromReq(req);
    if (!payload || !payload.email) return res.status(401).json({ message: 'Invalid or missing ID token' });
    const userEmail = payload.email;
    const doc = await Cart.findOne({ userEmail });
    res.json({ ok: true, userEmail, cart: doc ? doc.items : [] });
  } catch (err) {
    console.error('[GET /api/cart/load] error', err && err.message);
    res.status(500).json({ message: 'Failed to load cart', error: err.message });
  }
});

export default router;
