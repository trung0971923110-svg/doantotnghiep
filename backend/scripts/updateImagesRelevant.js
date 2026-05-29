import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://trung0971923110_db_user:Trung2004@builsanphamtheoyeucau.j4ckpyc.mongodb.net/sanpham';

function mapCategoryToKeyword(cat) {
  if (!cat) return '';
  if (typeof cat === 'object' && cat.name) cat = cat.name;
  const c = String(cat).toLowerCase();
  if (c.includes('cpu')) return 'cpu,processor';
  if (c.includes('main') || c.includes('board')) return 'motherboard';
  if (c.includes('ram')) return 'ram,memory';
  if (c.includes('vga') || c.includes('gpu') || c.includes('graphic')) return 'gpu,graphics card,video card';
  if (c.includes('psu') || c.includes('power')) return 'power-supply,psu';
  if (c.includes('ssd') || c.includes('nvme') || c.includes('hdd')) return 'ssd,storage,hard drive';
  if (c.includes('case')) return 'pc case,chassis';
  return c;
}

function extractModelKeywords(name) {
  if (!name) return '';
  const low = name.toLowerCase();
  const tokens = [];
  // common gpu prefixes
  const gpuMatch = low.match(/(rtx|gtx|radeon|rx)\s*\d{3,4}/i);
  if (gpuMatch) tokens.push(gpuMatch[0].replace(/\s+/g, '+'));
  // rtx/gtx series
  const series = low.match(/(rtx|gtx|rx)\s*\d+/i);
  if (series) tokens.push(series[0].replace(/\s+/g, '+'));
  // ryzen
  if (low.includes('ryzen')) {
    const ry = low.match(/ryzen\s*\d{1,4}/i);
    if (ry) tokens.push(ry[0].replace(/\s+/g, '+'));
    else tokens.push('ryzen');
  }
  // intel
  if (low.includes('intel') || low.includes('core')) {
    const i = low.match(/i\d[-\d]*/i) || low.match(/intel\s*core\s*i\d+/i);
    if (i) tokens.push(i[0].replace(/\s+/g, '+'));
    else tokens.push('intel+cpu');
  }
  // capacity like 1tb, 500gb
  const cap = low.match(/\d+\s?(tb|gb)/i);
  if (cap) tokens.push(cap[0].replace(/\s+/g, ''));

  // brand tokens
  const brandMatch = low.match(/asus|msi|gigabyte|corsair|kingston|samsung|antec|montech/);
  if (brandMatch) tokens.push(brandMatch[0]);

  return tokens.join(',');
}

function buildUnsplashQuery(product) {
  const name = product.name || '';
  const brand = product.brand || '';
  const catKeyword = mapCategoryToKeyword(product.category || '');
  const modelKeywords = extractModelKeywords(name);
  const parts = [];
  if (brand) parts.push(brand);
  if (modelKeywords) parts.push(modelKeywords);
  if (catKeyword) parts.push(catKeyword);
  const q = parts.join(',');
  if (!q) return `https://picsum.photos/seed/${encodeURIComponent(name)}/600/400`;
  return `https://source.unsplash.com/600x400/?${encodeURIComponent(q)}`;
}

async function run() {
  console.log('⏳ Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  const products = await Product.find({}).populate('category').lean();
  console.log(`ℹ️ Found ${products.length} products. Updating images...`);

  let updated = 0;
  for (const p of products) {
    const url = buildUnsplashQuery(p);
    if (!p.image || p.image !== url) {
      await Product.findByIdAndUpdate(p._id, { image: url });
      updated++;
      console.log(`Updated ${p.name} -> ${url}`);
    }
  }

  console.log(`✅ Updated ${updated} products.`);
  await mongoose.disconnect();
  console.log('🔌 Disconnected.');
}

run().catch(err => { console.error('❌ Failed:', err); mongoose.disconnect(); process.exit(1); });
