import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import fs from 'fs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sanpham';

async function loadMapping() {
  const p = new URL('./image-mapping.json', import.meta.url).pathname;
  if (fs.existsSync(p)) {
    try {
      const raw = fs.readFileSync(p, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse image-mapping.json, ignoring mapping file.');
    }
  }
  return null;
}

function seedImageForName(name, category, brand) {
  // Use picsum.photos seeded images (reliable and predictable)
  const seedParts = [name || '', brand || '', category || '']
    .join('-')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toLowerCase();
  const seed = encodeURIComponent(seedParts || 'product');
  return `https://picsum.photos/seed/${seed}/600/400`;
}

async function run() {
  console.log('⏳ Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  const mapping = await loadMapping();
  if (mapping) console.log('🔎 Found image-mapping.json — will use provided URLs when names match.');

  const products = await Product.find({}).lean();
  console.log(`ℹ️ Found ${products.length} products. Updating images...`);

  let updated = 0;
  for (const p of products) {
    const name = p.name || '';
    let url = null;
    if (mapping && mapping[name]) url = mapping[name];
    else {
      // category may be object id or name string in DB; attempt to read category name if provided
      const category = p.category || '';
      const brand = p.brand || '';
      url = seedImageForName(name, String(category).toLowerCase(), String(brand).toLowerCase());
    }

    // Only update if different
    if (!p.image || p.image !== url) {
      await Product.findByIdAndUpdate(p._id, { image: url });
      updated++;
      console.log(`Updated ${name} -> ${url}`);
    }
  }

  console.log(`✅ Updated ${updated} products.`);
  await mongoose.disconnect();
  console.log('🔌 Disconnected.');
}

run().catch(err => {
  console.error('❌ Failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
