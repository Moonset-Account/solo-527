import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as bookingService from '../services/bookingService.js';

const router = Router();

router.post('/group', authMiddleware, roleMiddleware(['school_contact']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id, school_id, participants } = req.body;
    if (!session_id || !school_id || !participants || !Array.isArray(participants)) {
      res.status(400).json({ success: false, error: '缺少必填字段' });
      return;
    }
    const result = bookingService.createGroupBooking(session_id, req.user!.userId, school_id, participants);
    if (result.error) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.status(201).json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.post('/individual', authMiddleware, roleMiddleware(['parent']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id, participants } = req.body;
    if (!session_id || !participants || !Array.isArray(participants)) {
      res.status(400).json({ success: false, error: '缺少必填字段' });
      return;
    }
    const result = bookingService.createIndividualBooking(session_id, req.user!.userId, participants);
    if (result.error) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.status(201).json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.user_id) filters.user_id = parseInt(req.query.user_id as string, 10);
    if (req.query.session_id) filters.session_id = parseInt(req.query.session_id as string, 10);
    const bookings = bookingService.list(filters);
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const booking = bookingService.getById(id);
    if (!booking) {
      res.status(404).json({ success: false, error: '预约不存在' });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.put('/:id/review', authMiddleware, roleMiddleware(['manager', 'admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const { action, note } = req.body;
    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, error: '操作无效，必须为 approve 或 reject' });
      return;
    }
    const result = bookingService.review(id, action, note || null, req.user!.userId);
    if (result.error) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.put('/:id/cancel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = bookingService.cancel(id, req.user!.userId);
    if (result.error) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

export default router;
