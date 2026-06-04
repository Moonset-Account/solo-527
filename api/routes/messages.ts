import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleCheck, type AuthRequest } from '../middleware/auth.js';
import * as messageService from '../services/messageService.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const read = req.query.read !== undefined ? req.query.read === 'true' : undefined;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const result = messageService.listMessages(req.user!.id, { read, page, limit });
  res.json({ success: true, data: result.messages, total: result.total, page, limit });
});

router.put('/:id/read', authMiddleware, (req: AuthRequest, res: Response): void => {
  const marked = messageService.markAsRead(parseInt(req.params.id), req.user!.id);
  if (!marked) {
    res.status(404).json({ success: false, error: 'Message not found' });
    return;
  }
  res.json({ success: true, message: 'Message marked as read' });
});

router.post('/send', authMiddleware, roleCheck('admin', 'receptionist', 'coach'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, title, content, type, sendEmail, toAddress, relatedEntityType, relatedEntityId } = req.body;
    const message = await messageService.sendMessage({
      userId,
      title,
      content,
      type: type || 'system',
      sendEmail: sendEmail || false,
      toAddress,
      relatedEntityType,
      relatedEntityId,
    });
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.get('/unread-count', authMiddleware, (req: AuthRequest, res: Response): void => {
  const count = messageService.getUnreadCount(req.user!.id);
  res.json({ success: true, data: { count } });
});

export default router;
