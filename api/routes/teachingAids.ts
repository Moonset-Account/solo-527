import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as teachingAidService from '../services/teachingAidService.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const aids = teachingAidService.list();
    res.json({ success: true, data: aids });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.post('/', authMiddleware, roleMiddleware(['manager', 'admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const aid = teachingAidService.create(req.body);
    res.status(201).json({ success: true, data: aid });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['manager', 'admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const aid = teachingAidService.update(id, req.body);
    if (!aid) {
      res.status(404).json({ success: false, error: '教具不存在' });
      return;
    }
    res.json({ success: true, data: aid });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.post('/:id/allocate', authMiddleware, roleMiddleware(['manager', 'admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const teaching_aid_id = parseInt(req.params.id, 10);
    const { session_id, quantity } = req.body;
    if (!session_id || !quantity) {
      res.status(400).json({ success: false, error: '缺少必填字段' });
      return;
    }
    const result = teachingAidService.allocate(teaching_aid_id, session_id, quantity);
    if (result.error) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.status(201).json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

export default router;
