import express from 'express';
import { cameraService } from '../services/cameraService.js';

const router = express.Router();

// Calculate camera setup details
router.post('/calculate', async (req, res) => {
  const { numRooms, numFloors, areaSqM, recordingDays, quality, type } = req.body;
  if (!numRooms || !numFloors || !recordingDays || !quality || !type) {
    return res.status(400).json({ message: 'Thiếu thông tin khảo sát lắp đặt camera' });
  }

  try {
    const result = await cameraService.calculateSetup({
      numRooms: Number(numRooms),
      numFloors: Number(numFloors),
      areaSqM: Number(areaSqM || 50),
      recordingDays: Number(recordingDays),
      quality,
      type
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tính toán cấu hình camera', error: err.message });
  }
});

export default router;
