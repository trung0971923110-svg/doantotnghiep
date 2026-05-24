import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

// Connect to MongoDB (Atlas or local fallback) and Start Server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sanpham';
if (!process.env.MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI not set; falling back to local:', MONGODB_URI);
}

console.log('⏳ Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas successfully!');
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`  PC Builder & Component Shop Server running on port ${PORT}`);
      console.log(`  Health Check URL: http://localhost:${PORT}/api/health`);
      console.log(`==================================================`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB Atlas:', err.message);
    process.exit(1);
  });
