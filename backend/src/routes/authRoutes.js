import express from 'express';
import { dbService } from '../services/dbService.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = dbService.getCollection('users');
  
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  // Generate a mock token
  const token = `mock-jwt-token-for-${user.id}-${user.role}`;
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    token
  });
});

export default router;
