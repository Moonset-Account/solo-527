import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as sessionService from '../services/sessionService.js';

const router = Router();

router.get('/calendar', async (req: Request, res: Response): Promise<void> => {
  try {
    const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const calendar = sessionService.getCalendar(month, year);
    res.json({ success: true, data: calendar });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: any = {};
    if (req.query.course_id) filters.course_id = parseInt(req.query.course_id as string, 10);
    if (req.query.date) filters.date = req.query.date as string;
    if (req.query.status) filters.status = req.query.status as string;
    const sessions = sessionService.list(filters);
    res.json({ success: true, data: sessions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.post('/', authMiddleware, roleMiddleware(['manager', 'admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = sessionService.create(req.body);
    if (result.error) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.status(201).json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const session = sessionService.getById(id);
    if (!session) {
      res.status(404).json({ success: false, error: '场次不存在' });
      return;
    }
    res.json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['manager', 'admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const session = sessionService.update(id, req.body);
    if (!session) {
      res.status(404).json({ success: false, error: '场次不存在' });
      return;
    }
    res.json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

export default router;
