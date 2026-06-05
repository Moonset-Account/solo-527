import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import * as auditService from '../services/auditService.js';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: any = {};
    if (req.query.user_id) filters.user_id = parseInt(req.query.user_id as string, 10);
    if (req.query.entity_type) filters.entity_type = req.query.entity_type as string;
    if (req.query.action) filters.action = req.query.action as string;
    const logs = auditService.list(filters);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

export default router;
