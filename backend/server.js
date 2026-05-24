import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import authRoutes from './src/routes/authRoutes.js';
import inventoryRoutes from './src/routes/inventoryRoutes.js';
import repairRoutes from './src/routes/repairRoutes.js';
import pcBuilderRoutes from './src/routes/pcBuilderRoutes.js';
import cameraRoutes from './src/routes/cameraRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve cached proxied images from backend/public/proxied_images
// Serve entire public folder under /images (placeholder and other statics)
app.use('/images', express.static(path.join(process.cwd(), 'public')));
// Also keep a dedicated route for proxied images for compatibility
app.use('/images/proxy', express.static(path.join(process.cwd(), 'public', 'proxied_images')));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Setup API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/pc-builder', pcBuilderRoutes);
app.use('/api/camera', cameraRoutes);

// Base route for status check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ITSurv-SMS Backend is running smoothly!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Lỗi hệ thống máy chủ xảy ra!', error: err.message });
});

// Connect to MongoDB (Atlas, local, or in-memory fallback for dev) and Start Server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sanpham';

async function startServerWithUri(uri) {
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB.');
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  PC Builder & Component Shop Server running on port ${PORT}`);
    console.log(`  Health Check URL: http://localhost:${PORT}/api/health`);
    console.log(`==================================================`);
  });
}

console.log('⏳ Connecting to MongoDB...');
startServerWithUri(MONGODB_URI).catch(async (err) => {
  console.warn('⚠️ Initial MongoDB connection failed:', err.message);
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Production requires a working MongoDB. Exiting.');
    process.exit(1);
  }

  // Try an in-memory MongoDB for local development
  try {
    console.log('🧪 Falling back to in-memory MongoDB for development...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    await startServerWithUri(memUri);
    // Seed the in-memory database so the frontend has products to display
    try {
      console.log('📦 Seeding in-memory database...');
      const cp = await import('child_process');
      const seedPath = new URL('./seedPC.js', import.meta.url).pathname;
      const child = cp.spawn('node', [seedPath, memUri], { stdio: 'inherit' });
      child.on('close', (code) => {
        console.log(`📦 Seed process exited with code ${code}`);
      });
    } catch (seedErr) {
      console.warn('⚠️ Failed to run seed script for in-memory DB:', seedErr.message);
    }
  } catch (memErr) {
    console.error('❌ Failed to start in-memory MongoDB:', memErr.message);
    process.exit(1);
  }
});
