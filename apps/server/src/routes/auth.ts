import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';

const router = Router();

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const user = result.rows[0];
    
    if (user.is_frozen) {
      return res.status(403).json({ error: '账户已被冻结', reason: user.frozen_reason });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    await createAuditLog({
      userId: user.id,
      action: 'login',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(400).json({ error: '请求参数错误' });
  }
});

router.get('/me', authenticate, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  await createAuditLog({
    userId: req.user?.id,
    action: 'logout',
    entityType: 'user',
    entityId: req.user?.id,
    ipAddress: req.ip
  });
  res.json({ message: '已退出登录' });
});

export default router;
