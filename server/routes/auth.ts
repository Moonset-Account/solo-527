import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.ts';
import { authenticate } from '../middleware/auth.ts';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const result = await query(
      'SELECT id, username, password_hash, full_name, role, store_id, region_id FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    if (req.session) {
      req.session.token = token;
      req.session.userId = user.id;
    }
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        store_id: user.store_id,
        region_id: user.region_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

router.post('/logout', authenticate, async (req, res) => {
  if (req.session) {
    req.session.destroy(() => {});
  }
  res.json({ message: '已退出登录' });
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
