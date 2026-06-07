import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiService } from '../services/aiService.js';

const router = express.Router();

// ✅ Route chat chính
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Missing message' });

    const reply = await aiService.generateResponse(message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: 'AI Service Error', error: err.message });
  }
});

// 🔍 Route test để chẩn đoán lỗi API Key
router.get('/test', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      status: 'ERROR',
      problem: 'GEMINI_API_KEY không có trong biến môi trường!',
      fix: 'Kiểm tra file .env và restart server'
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Nói "xin chào" bằng tiếng Việt trong 3 từ');
    const text = result.response.text();
    return res.json({
      status: 'OK',
      keyPrefix: apiKey.substring(0, 10) + '...',
      keyLength: apiKey.length,
      testResponse: text
    });
  } catch (err) {
    return res.status(500).json({
      status: 'ERROR',
      keyPrefix: apiKey.substring(0, 10) + '...',
      keyLength: apiKey.length,
      errorMessage: err.message,
      errorStatus: err.status,
      errorDetails: JSON.stringify(err)
    });
  }
});

export default router;