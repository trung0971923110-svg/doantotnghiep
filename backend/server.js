import express from 'express';
import cors from 'cors';
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

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  ITSurv-SMS Backend API Server running on port ${PORT}`);
  console.log(`  Health Check URL: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});
