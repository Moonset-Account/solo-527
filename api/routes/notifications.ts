import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as notificationService from '../services/notificationService.js';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = notificationService.list(req.user!.userId);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.put('/:id/read', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = notificationService.markRead(id);
    if (result.error) {
      res.status(404).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

export default router;
