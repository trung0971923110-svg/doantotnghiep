import express from 'express';
import { pcBuilderService } from '../services/pcBuilderService.js';

const router = express.Router();

// Verify components compatibility
router.post('/compatibility', async (req, res) => {
  const { parts } = req.body;
  if (!parts) {
    return res.status(400).json({ message: 'Thiếu thông tin danh sách linh kiện cần kiểm tra' });
  }
  try {
    const result = await pcBuilderService.checkCompatibility(parts);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi kiểm tra độ tương thích', error: err.message });
  }
});

// Auto suggest configuration
router.post('/suggest', async (req, res) => {
  const { budget, need, count } = req.body;
  if (!budget || !need) {
    return res.status(400).json({ message: 'Thiếu thông tin ngân sách hoặc nhu cầu sử dụng' });
  }

  try {
    const suggestion = await pcBuilderService.suggestBuild(Number(budget), need, count ? Number(count) : 3);
    if (!suggestion || suggestion.length === 0) {
      return res.status(404).json({ message: 'Không thể đề xuất cấu hình phù hợp với ngân sách và yêu cầu hiện tại.' });
    }
    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi đề xuất cấu hình', error: err.message });
  }
});

export default router;
