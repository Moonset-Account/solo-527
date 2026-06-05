import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as feedbackService from '../services/feedbackService.js';

const router = Router();

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id, booking_id, rating, comment } = req.body;
    if (!session_id || !booking_id || !rating) {
      res.status(400).json({ success: false, error: '缺少必填字段' });
      return;
    }
    const result = feedbackService.create(session_id, booking_id, req.user!.userId, rating, comment || '');
    if (result.error) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.status(201).json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.get('/stats', authMiddleware, roleMiddleware(['manager', 'admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: any = {};
    if (req.query.course_id) filters.course_id = parseInt(req.query.course_id as string, 10);
    if (req.query.guide_id) filters.guide_id = parseInt(req.query.guide_id as string, 10);
    if (req.query.session_id) filters.session_id = parseInt(req.query.session_id as string, 10);
    const result = feedbackService.getStats(filters);
    res.json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

export default router;
