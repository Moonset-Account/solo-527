import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth.js';
import * as groupClassService from '../services/groupClassService.js';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const filters: Record<string, unknown> = {};
  if (req.query.coach_id) filters.coach_id = parseInt(req.query.coach_id as string);
  if (req.query.status) filters.status = req.query.status as string;
  const classes = groupClassService.listGroupClasses(filters);
  res.json({ success: true, data: classes });
});

router.post('/', authMiddleware, roleCheck('admin', 'coach'), (req: Request, res: Response): void => {
  try {
    const groupClass = groupClassService.createGroupClass(req.body);
    res.status(201).json({ success: true, data: groupClass });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id', authMiddleware, roleCheck('admin', 'coach'), (req: Request, res: Response): void => {
  const groupClass = groupClassService.updateGroupClass(parseInt(req.params.id), req.body);
  if (!groupClass) {
    res.status(404).json({ success: false, error: 'Group class not found' });
    return;
  }
  res.json({ success: true, data: groupClass });
});

router.delete('/:id', authMiddleware, roleCheck('admin'), (req: Request, res: Response): void => {
  const deleted = groupClassService.deleteGroupClass(parseInt(req.params.id));
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Group class not found' });
    return;
  }
  res.json({ success: true, message: 'Group class deleted' });
});

router.post('/:id/book', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { member_id } = req.body;
    const appointment = await groupClassService.bookGroupClass(parseInt(req.params.id), member_id);
    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Group class not found' });
      return;
    }
    if (msg === 'CLASS_FULL') {
      res.status(400).json({ success: false, error: 'Class is full' });
      return;
    }
    if (msg === 'MEMBER_FROZEN') {
      res.status(400).json({ success: false, error: 'Member is frozen and cannot book classes' });
      return;
    }
    res.status(400).json({ success: false, error: msg });
  }
});

router.delete('/:id/book', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { member_id } = req.body;
    groupClassService.cancelGroupClassBooking(parseInt(req.params.id), member_id);
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Group class not found' });
      return;
    }
    if (msg === 'BOOKING_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }
    res.status(400).json({ success: false, error: msg });
  }
});

export default router;
