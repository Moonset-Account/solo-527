import { Router, type Request, type Response } from 'express';
import * as authService from '../services/authService.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ success: false, error: 'Username and password required' });
    return;
  }

  const result = authService.login(username, password);
  if (!result) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  res.json({ success: true, data: result });
});

router.post('/logout', authMiddleware, (_req: Request, res: Response): void => {
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  const user = authService.getCurrentUser(req.user!.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, data: user });
});

export default router;
