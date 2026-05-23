import express from 'express';
import { pcBuilderService } from '../services/pcBuilderService.js';

const router = express.Router();

// Verify components compatibility
router.post('/compatibility', (req, res) => {
  const { parts } = req.body;
  if (!parts) {
    return res.status(400).json({ message: 'Thiếu thông tin danh sách linh kiện cần kiểm tra' });
  }
  const result = pcBuilderService.checkCompatibility(parts);
  res.json(result);
});

// Auto suggest configuration
router.post('/suggest', (req, res) => {
  const { budget, need } = req.body;
  if (!budget || !need) {
    return res.status(400).json({ message: 'Thiếu thông tin ngân sách hoặc nhu cầu sử dụng' });
  }
  
  const suggestion = pcBuilderService.suggestBuild(Number(budget), need);
  if (!suggestion) {
    return res.status(404).json({ message: 'Không thể đề xuất cấu hình phù hợp với ngân sách và yêu cầu hiện tại.' });
  }

  res.json(suggestion);
});

export default router;
