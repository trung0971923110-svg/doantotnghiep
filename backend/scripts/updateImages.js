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
  // Prefer more relevant images using Unsplash source queries (keyword-based)
  const cat = (category || '').toLowerCase();
  const b = (brand || '').toLowerCase();

  const catMap = {
    cpu: 'cpu,processor,computer',
    mainboard: 'motherboard,mainboard,pc motherboard',
    ram: 'ram,memory,computer memory',
    vga: 'gpu,graphics card,video card',
    psu: 'power supply,psu,power supply unit',
    ssd: 'ssd,solid state drive,storage,hard drive',
    case: 'pc case,computer case,chassis',
    camera: 'camera,cctv,security camera',
    dvr: 'dvr,recording device',
    hdd: 'hard drive,hdd,storage'
  };

  let keywords = '';
  // category may be stored as name string or id; try to use category value
  if (cat && Object.keys(catMap).includes(cat)) keywords = catMap[cat];
  // if brand present, include brand as keyword to bias results
  if (b) {
    const brandTerm = b.split(/\s+/).slice(0,2).join(',');
    keywords = keywords ? `${brandTerm},${keywords}` : brandTerm;
  }

  // fallback to picsum seeded image if no keywords
  if (!keywords) {
    const seed = encodeURIComponent((name || 'product').replace(/\s+/g, '-').toLowerCase());
    return `https://picsum.photos/seed/${seed}/600/400`;
  }

  // Use Unsplash random image for the keywords
  return `https://source.unsplash.com/600x400/?${encodeURIComponent(keywords)}`;
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
