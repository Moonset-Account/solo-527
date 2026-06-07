import { Router, type Request, type Response } from 'express';
import { getDB } from '../db/index.js';
import { generateToken, invalidateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '请提供用户名和密码',
      });
      return;
    }

    const user = await getDB().validateCredentials(username, password);
    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
      return;
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          organization: user.organization,
        },
        token,
      },
      message: '登录成功',
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败',
    });
  }
});

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      invalidateToken(token);
    }

    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({
      success: false,
      error: '登出失败',
    });
  }
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role, organization } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '请提供用户名和密码',
      });
      return;
    }

    const existingUser = await getDB().getUserByUsername(username);
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: '用户名已存在',
      });
      return;
    }

    res.status(501).json({
      success: false,
      error: '注册功能暂未开放，请联系管理员',
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({
      success: false,
      error: '注册失败',
    });
  }
});

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        authenticated: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    });
  }
});

export default router;
