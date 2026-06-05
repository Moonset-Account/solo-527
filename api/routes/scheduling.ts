import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as schedulingService from '../services/schedulingService.js';

const router = Router();

router.get('/conflicts', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const guide_id = parseInt(req.query.guide_id as string, 10);
    const date = req.query.date as string;
    const start_time = req.query.start_time as string;
    const end_time = req.query.end_time as string;
    if (!guide_id || !date || !start_time || !end_time) {
      res.status(400).json({ success: false, error: '缺少必填参数' });
      return;
    }
    const result = schedulingService.checkConflicts(guide_id, date, start_time, end_time);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: any = {};
    if (req.query.guide_id) filters.guide_id = parseInt(req.query.guide_id as string, 10);
    if (req.query.session_id) filters.session_id = parseInt(req.query.session_id as string, 10);
    const assignments = schedulingService.list(filters);
    res.json({ success: true, data: assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.post('/assign', authMiddleware, roleMiddleware(['manager', 'admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id, guide_id } = req.body;
    if (!session_id || !guide_id) {
      res.status(400).json({ success: false, error: '缺少必填字段' });
      return;
    }
    const result = schedulingService.assign(session_id, guide_id);
    if (result.error) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.status(201).json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware(['manager', 'admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = schedulingService.remove(id);
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
