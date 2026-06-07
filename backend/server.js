import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dns from 'dns';
import http from 'http';
import { fileURLToPath } from 'url';
import { Server as IOServer } from 'socket.io';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import authRoutes from './src/routes/authRoutes.js';
import cameraRoutes from './src/routes/cameraRoutes.js';
import inventoryRoutes from './src/routes/inventoryRoutes.js';
import repairRoutes from './src/routes/repairRoutes.js';
import pcBuilderRoutes from './src/routes/pcBuilderRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';
import Product from './src/models/Product.js';
import orderRoutes from './src/routes/orderRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình đường dẫn Frontend chính xác cho Render/Local
const possiblePaths = [
  path.resolve(process.cwd(), 'frontend', 'dist'),   // Root trên Render
  path.resolve(__dirname, '..', 'frontend', 'dist'), // Anh em với backend
  path.resolve(__dirname, 'frontend', 'dist')        // Trong backend (nếu có)
];
let frontendPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

if (!fs.existsSync(frontendPath)) {
  console.log(`[Static Files] ❌ Cảnh báo: Không tìm thấy thư mục dist tại: ${frontendPath}`);
} else {
  console.log(`[Static Files] ✅ Đã tìm thấy thư mục dist tại: ${frontendPath}`);
}

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// 1. PHỤC VỤ TỆP TĨNH (Không đi qua Middleware DB)
app.use(express.static(frontendPath));
app.use('/images', express.static(path.resolve(__dirname, 'public')));
app.use('/images/proxy', express.static(path.resolve(__dirname, 'public', 'proxied_images')));

// 2. HEALTH CHECK (Nhanh, không cần DB)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ITSurv-SMS Backend is running smoothly!' });
});

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection Logic (optimized for Serverless)
const ATLAS_URI = 'mongodb+srv://trung0971923110_db_user:Trung2004@builsanphamtheoyeucau.j4ckpyc.mongodb.net/sanpham';
const MONGODB_URI = process.env.MONGODB_URI || ATLAS_URI;

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
    const maskedUri = MONGODB_URI.includes('@') ? MONGODB_URI.split('@')[1] : MONGODB_URI;
    console.log(`✅ Connected to MongoDB at: ${maskedUri}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error; // Re-throw to be caught by the middleware
  }
}

// 3. MIDDLEWARE KIỂM TRA DB (Chỉ áp dụng cho các route /api)
app.use('/api', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase();
    }
    next();
  } catch (err) {
    res.status(503).json({ message: 'Cơ sở dữ liệu đang bận, vui lòng thử lại sau', error: err.message });
  }
});

// 4. CẤU HÌNH API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/pc-builder', pcBuilderRoutes);
app.use('/api/camera', cameraRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Catch-all route: Trả về index.html cho bất kỳ yêu cầu nào không khớp với API
// Điều này rất quan trọng để React Router hoạt động bình thường trên Web
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      message: "Frontend build not found.", 
      resolvedPath: indexPath,
      tip: "Kiểm tra lại lệnh Build Command trên Render Dashboard"
    });
  }
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
  const PORT = process.env.PORT || 5001;
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
