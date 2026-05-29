import mongoose from 'mongoose';
import 'dotenv/config';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://trung0971923110_db_user:Trung2004@builsanphamtheoyeucau.j4ckpyc.mongodb.net/sanpham';

const productSchema = new mongoose.Schema(
  { name: String, category: mongoose.Schema.Types.ObjectId, price: Number, image: String },
  { collection: 'products' }
);

const Product = mongoose.model('Product', productSchema);

async function fixImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const products = await Product.find({}).lean();
    console.log(`Found ${products.length} products`);

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      // Generate a stable picsum URL based on product name hash
      const hash = Buffer.from(p.name || '').toString('base64').replace(/[^0-9]/g, '').slice(0, 5) || String(i);
      const newImage = `https://picsum.photos/seed/${encodeURI(p.name || 'product')}/600/400`;
      
      await Product.updateOne(
        { _id: p._id },
        { image: newImage }
      );
      console.log(`  ✅ ${p.name} → ${newImage}`);
    }

    console.log('🎉 All product images updated to use picsum.photos (reliable source)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixImages();
