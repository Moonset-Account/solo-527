import { Router, type Request, type Response } from 'express';
import * as authService from '../services/authService.js';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password, name, phone, role } = req.body;
    if (!email || !username || !password || !name || !role) {
      res.status(400).json({ success: false, error: '缺少必填字段' });
      return;
    }
    const result = authService.register(email, username, password, name, phone || '', role);
    if (result.error) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.status(201).json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: '缺少用户名或密码' });
      return;
    }
    const result = authService.login(username, password);
    if (result.error) {
      res.status(401).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

export default router;
