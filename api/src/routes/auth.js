import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { writeLog } from '../utils/logger.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password || ''))) {
    await writeLog({
      action: '登录失败', category: 'auth',
      username, detail: `用户名或密码错误`, ip: req.ip
    });
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user._id, role: user.role },
    process.env.JWT_SECRET || 'dev-secret', { expiresIn: '12h' });
  res.cookie('token', token, {
    httpOnly: true, maxAge: 12 * 60 * 60 * 1000, sameSite: 'lax'
  });
  await writeLog({
    action: '登录成功', category: 'auth',
    userId: user._id, username: user.username, userRole: user.role, ip: req.ip
  });
  res.json({ token, user: { _id: user._id, username: user.username, name: user.name, role: user.role, department: user.department } });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
