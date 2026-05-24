import express from 'express';
import { pcBuilderService } from '../services/pcBuilderService.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import http from 'http';
import https from 'https';

const router = express.Router();

// Verify components compatibility
router.post('/compatibility', async (req, res) => {
  const { parts } = req.body;
  if (!parts) {
    return res.status(400).json({ message: 'Thiếu thông tin danh sách linh kiện cần kiểm tra' });
  }
  try {
    const result = await pcBuilderService.checkCompatibility(parts);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi kiểm tra độ tương thích', error: err.message });
  }
});

// Auto suggest configuration
router.post('/suggest', async (req, res) => {
  const { budget, need, count } = req.body;
  if (!budget || !need) {
    return res.status(400).json({ message: 'Thiếu thông tin ngân sách hoặc nhu cầu sử dụng' });
  }

  try {
    const suggestion = await pcBuilderService.suggestBuild(Number(budget), need, count ? Number(count) : 3);
    if (!suggestion || suggestion.length === 0) {
      return res.status(404).json({ message: 'Không thể đề xuất cấu hình phù hợp với ngân sách và yêu cầu hiện tại.' });
    }
    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi đề xuất cấu hình', error: err.message });
  }
});

// GET products (simple product listing for storefront)
router.get('/products', async (req, res) => {
  try {
    const { category, limit } = req.query;
    const filter = {};
    if (category) {
      // allow category name or id
      let cat = null;
      if (/^[0-9a-fA-F]{24}$/.test(category)) {
        cat = await Category.findById(category);
      } else {
        cat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
      }
      if (cat) filter.category = cat._id;
    }

    const q = Product.find(filter).sort({ price: -1 }).limit(Number(limit) || 0).lean();
    const products = await q;
    // populate category name client-side-friendly
    const cats = await Category.find({ _id: { $in: products.map(p => p.category).filter(Boolean) } }).lean();
    const catMap = Object.fromEntries(cats.map(c => [String(c._id), c.name]));
    const out = products.map(p => ({ ...p, category: catMap[String(p.category)] || p.category }));
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải danh sách sản phẩm', error: err.message });
  }
});

// Image proxy to avoid external hotlink/CORS issues
router.get('/image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('Missing url');
    let parsed;
    try { parsed = new URL(url); } catch (e) { return res.status(400).send('Invalid url'); }
    if (!['http:', 'https:'].includes(parsed.protocol)) return res.status(400).send('Invalid protocol');

    const client = parsed.protocol === 'https:' ? https : http;
    const prox = client.get(parsed.href, (proxRes) => {
      if (proxRes.statusCode >= 400) {
        res.sendStatus(proxRes.statusCode);
        return;
      }
      const ct = proxRes.headers['content-type'] || 'application/octet-stream';
      res.setHeader('content-type', ct);
      res.setHeader('cache-control', 'public, max-age=86400');
      proxRes.pipe(res);
    });
    prox.on('error', (err) => {
      console.error('Image proxy error', err.message);
      res.sendStatus(502);
    });
  } catch (err) {
    res.status(500).json({ message: 'Proxy error', error: err.message });
  }
});

export default router;

