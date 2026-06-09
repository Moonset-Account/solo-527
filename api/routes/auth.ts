import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import AdminService from '../services/AdminService.js';
import { authenticateToken, signToken } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/monitor.js';
import type { JwtPayload } from '#shared/types';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', loginLimiter, (req: Request, res: Response): void => {
  try {
    const parsed = loginSchema.parse(req.body);
    const user = AdminService.getUserByEmail(parsed.email);

    if (!user) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' });
      return;
    }

    const ok = bcrypt.compareSync(parsed.password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' });
      return;
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    const token = signToken(payload);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: '参数错误', details: err.errors });
    } else {
      res.locals.errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: '登录失败' });
    }
  }
});

router.post('/logout', authenticateToken, (_req: Request, res: Response): void => {
  res.json({ success: true, message: '已登出' });
});

router.get('/me', authenticateToken, (req: Request, res: Response): void => {
  res.json({ success: true, data: req.user });
});

export default router;
