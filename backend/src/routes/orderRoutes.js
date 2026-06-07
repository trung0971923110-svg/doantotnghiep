import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Create order (no auth required for customer checkout)
router.post('/create', async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, items } = req.body;
    if (!customerName || !customerPhone || !customerAddress) return res.status(400).json({ message: 'Missing customer info' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Cart items required' });

    // Validate products and compute total
    let total = 0;
    const details = [];
    for (const it of items) {
      if (!it.productId) return res.status(400).json({ message: 'productId required for each item' });
      const prod = await Product.findById(it.productId).lean();
      if (!prod) return res.status(400).json({ message: `Product not found: ${it.productId}` });
      const qty = Math.max(1, Number(it.qty) || 1);
      const price = Number(it.price) || prod.price || 0;
      total += price * qty;
      details.push({ product: prod._id, quantity: qty, price });
    }

    const order = new Order({ user: null, customerName, customerPhone, customerAddress, totalPrice: total, details });
    await order.save();
    res.status(201).json({ ok: true, orderId: order._id });

    // Non-blocking: append to local sample DB for convenience
    (async () => {
      try {
        const dbPath = path.resolve(process.cwd(), 'backend', 'data', 'db.json');
        let dbObj = {};
        if (fs.existsSync(dbPath)) {
          const raw = await fs.promises.readFile(dbPath, 'utf8');
          dbObj = raw ? JSON.parse(raw) : {};
        }
        dbObj.orders = dbObj.orders || [];
        const localOrder = {
          id: String(order._id),
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerAddress: order.customerAddress,
          totalPrice: order.totalPrice,
          status: order.status,
          details: (order.details || []).map(d => ({ product: String(d.product), quantity: d.quantity, price: d.price })),
          createdAt: order.createdAt || new Date().toISOString()
        };
        dbObj.orders.push(localOrder);
        await fs.promises.writeFile(dbPath, JSON.stringify(dbObj, null, 2), 'utf8');
      } catch (e) {
        console.warn('[sync] failed to update local db.json for orders:', e && e.message);
      }
    })();
  } catch (err) {
    console.error('[POST /api/orders/create] error', err && err.message);
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
});

export default router;
