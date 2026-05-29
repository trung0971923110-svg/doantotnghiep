import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import authRoutes from './src/routes/authRoutes.js';
import cameraRoutes from './src/routes/cameraRoutes.js';
import inventoryRoutes from './src/routes/inventoryRoutes.js';
import repairRoutes from './src/routes/repairRoutes.js';
import pcBuilderRoutes from './src/routes/pcBuilderRoutes.js';
import Product from './src/models/Product.js';

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve cached proxied images from backend/public/proxied_images
// Serve entire public folder under /images (placeholder and other statics)
app.use('/images', express.static(path.join(process.cwd(), 'backend', 'public')));
// Also keep a dedicated route for proxied images for compatibility
app.use('/images/proxy', express.static(path.join(process.cwd(), 'backend', 'public', 'proxied_images')));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection Logic (optimized for Serverless)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://trung0971923110_db_user:Trung2004@builsanphamtheoyeucau.j4ckpyc.mongodb.net/sanpham';

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached MongoDB connection.');
    return cachedDb;
  }
  
  if (mongoose.connection.readyState === 2 || mongoose.connection.readyState === 3) {
    console.log('⏳ MongoDB connection is pending or disconnecting, waiting...');
  }

  console.log('⏳ Connecting to new MongoDB instance...');
  const opts = {
    bufferCommands: false, // Disable Mongoose buffering for serverless
  };

  try {
    const conn = await mongoose.connect(MONGODB_URI, opts);
    cachedDb = conn;
    console.log(`✅ Connected to MongoDB at: ${MONGODB_URI}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error; // Re-throw to be caught by the middleware
  }
}

// Đảm bảo middleware này nằm TRƯỚC các dòng app.use('/api/...')
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase();
    }
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ message: 'Không thể kết nối cơ sở dữ liệu' });
  }
});

// Setup API Routes
app.use('/api/auth', authRoutes); // Ensure these imports are at the top of the file
app.use('/api/inventory', inventoryRoutes); // or within the route definitions if they depend on `app`
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

// Export the app for Vercel
export default app;

// Local development server start (only if not on Vercel)
if (!process.env.VERCEL) {
  import http from 'http';
  import { Server as IOServer } from 'socket.io';
  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app); // Create server here for local
  const io = new IOServer(server, { cors: { origin: '*' } });
  app.set('io', io); // Set io for local

  // Initial connection for local server
  connectToDatabase().then(() => {
    console.log(`✅ MongoDB Connected for local server`);

    // Try to establish a MongoDB change stream to broadcast external DB updates
    try {
      // Change streams chỉ chạy ở môi trường server truyền thống
      const changeStream = Product.watch([], { fullDocument: 'updateLookup' });
      changeStream.on('change', (change) => {
        try {
          if (!io) return;
          if (change.operationType === 'update' || change.operationType === 'replace') {
            const doc = change.fullDocument;
            if (doc) io.emit('productUpdated', { id: String(doc._id), image: doc.image });
          } else if (change.operationType === 'insert') {
            const doc = change.fullDocument;
            if (doc) io.emit('productInserted', { id: String(doc._id), image: doc.image });
          }
        } catch (e) { console.warn('changeStream emit error', e && e.message); }
      });
      changeStream.on('error', (err) => console.warn('Product changeStream error:', err && err.message));
    } catch (e) {
      console.warn('MongoDB change streams not available in this environment:', e && e.message);
    }

    server.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`  PC Builder & Component Shop Server running on port ${PORT}`);
      console.log(`  Health Check URL: http://localhost:${PORT}/api/health`);
      console.log(`==================================================`);
    });
  }).catch(err => {
    console.error('❌ Initial MongoDB connection failed for local server:', err.message);
    process.exit(1);
  });
}
