import express from 'express';
import { pcBuilderService } from '../services/pcBuilderService.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const router = express.Router();

// Setup upload directory and multer storage for admin image uploads
const uploadDir = path.join(process.cwd(), 'public', 'proxied_images');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) { /* ignore */ }
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/ig, '-').toLowerCase();
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

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
    const { category, limit, brand } = req.query;
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
    // optional brand filter (case-insensitive)
    if (brand) {
      // allow comma-separated list
      const brands = String(brand).split(',').map(b => b.trim()).filter(Boolean);
      if (brands.length) {
        filter.brand = { $in: brands.map(b => new RegExp(`^${b}$`, 'i')) };
      }
    }
    // optional capacity filter (numeric)
    if (req.query.capacity && req.query.capacity !== 'all') {
      filter['attributes.capacity'] = Number(req.query.capacity);
    }
    // optional series filter (e.g. i3, i5, i7, r5, r7) - Lọc theo tên sản phẩm
    if (req.query.series && req.query.series !== 'all' && category === 'cpu') {
      filter.name = { $regex: new RegExp(req.query.series, 'i') };
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

// GET single product by id
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prod = await Product.findById(id).lean();
    if (!prod) return res.status(404).json({ message: 'Product not found' });
    const cat = prod.category ? await Category.findById(prod.category).lean() : null;
    const out = { ...prod, category: cat ? cat.name : prod.category };
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải sản phẩm', error: err.message });
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

    // Follow redirects and set browser-like headers to avoid blocking
    const maxRedirects = 6;
    let redirects = 0;

    const fetchWithRedirects = (urlObj) => new Promise((resolve, reject) => {
      const client = urlObj.protocol === 'https:' ? https : http;
      const opts = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      };
      const r = client.get(urlObj.href, opts, (upstream) => {
        if (upstream.statusCode >= 300 && upstream.statusCode < 400 && upstream.headers.location) {
          if (redirects >= maxRedirects) {
            reject(new Error('Too many redirects'));
            return;
          }
          redirects++;
          try {
            const next = new URL(upstream.headers.location, urlObj.href);
            upstream.resume();
            resolve(fetchWithRedirects(next));
          } catch (e) { reject(e); }
          return;
        }
        if (upstream.statusCode >= 400) {
          const err = new Error(`HTTP ${upstream.statusCode}`);
          err.status = upstream.statusCode;
          reject(err);
          return;
        }
        resolve(upstream);
      });
      r.on('error', reject);
      r.setTimeout(10000, () => {
        r.destroy();
        reject(new Error('Upstream timeout'));
      });
    });

    const upstream = await fetchWithRedirects(parsed);
    const ct = upstream.headers['content-type'] || 'image/jpeg';
    res.setHeader('content-type', ct);
    res.setHeader('cache-control', 'public, max-age=86400');
    upstream.pipe(res);
  } catch (err) {
    console.error('[image-proxy] error:', err && err.message ? err.message : err);
    if (err && err.status) return res.sendStatus(err.status);
    res.sendStatus(502);
  }
});

// Admin endpoint: upload image file and set as product image by id
router.post('/products/:id/image', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const rel = `/images/proxy/${req.file.filename}`;
    const prod = await Product.findByIdAndUpdate(id, { image: rel }, { new: true }).lean();
    if (!prod) return res.status(404).json({ message: 'Product not found' });
    // Return updated product
    const cat = prod.category ? await Category.findById(prod.category).lean() : null;
    // Emit realtime update to connected clients
    try {
      const io = req.app.get('io');
      if (io) io.emit('productUpdated', { id: prod._id, image: rel });
    } catch (e) { /* ignore */ }
    res.json({ ...prod, category: cat ? cat.name : prod.category });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// Admin endpoint: upload image and set by product name (case-insensitive)
router.post('/products/by-name/image', upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Missing product name' });
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const prod = await Product.findOneAndUpdate({ name: { $regex: new RegExp(`^${name}$`, 'i') } }, { image: `/images/proxy/${req.file.filename}` }, { new: true }).lean();
    if (!prod) return res.status(404).json({ message: 'Product not found' });
    const cat = prod.category ? await Category.findById(prod.category).lean() : null;
    try {
      const io = req.app.get('io');
      if (io) io.emit('productUpdated', { id: prod._id, image: prod.image });
    } catch (e) { /* ignore */ }
    res.json({ ...prod, category: cat ? cat.name : prod.category });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

export default router;
