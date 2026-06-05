import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as checkinService from '../services/checkinService.js';

const router = Router();

router.post('/:sessionId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    const { participant_id } = req.body;
    if (!participant_id) {
      res.status(400).json({ success: false, error: '缺少参与者ID' });
      return;
    }
    const result = checkinService.checkin(sessionId, participant_id);
    if (result.error) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, data: result.data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

router.get('/:sessionId/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    const result = checkinService.getStatus(sessionId);
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
