import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: '请提供邮箱和密码' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { athlete: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      athleteId: user.athleteId || undefined,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        athleteId: user.athleteId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: '登录失败，请稍后重试' });
  }
});

router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: '已成功登出' });
});

router.post('/register', async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, error: '演示模式不支持注册' });
});

export default router;
