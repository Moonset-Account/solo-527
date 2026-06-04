import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleCheck, type AuthRequest } from '../middleware/auth.js';
import * as scheduleService from '../services/scheduleService.js';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const filters: Record<string, unknown> = {};
  if (req.query.coach_id) filters.coach_id = parseInt(req.query.coach_id as string);
  if (req.query.date) filters.date = req.query.date as string;
  if (req.query.start_date) filters.start_date = req.query.start_date as string;
  if (req.query.end_date) filters.end_date = req.query.end_date as string;
  const schedules = scheduleService.listSchedules(filters);
  res.json({ success: true, data: schedules });
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const schedule = scheduleService.createSchedule(req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.put('/:id/approve', authMiddleware, roleCheck('admin'), (req: AuthRequest, res: Response): void => {
  const action = req.body.action as string;
  let schedule;
  if (action === 'reject') {
    schedule = scheduleService.rejectSchedule(parseInt(req.params.id), req.user!.id);
  } else {
    schedule = scheduleService.approveSchedule(parseInt(req.params.id), req.user!.id);
  }
  if (!schedule) {
    res.status(404).json({ success: false, error: 'Schedule not found or not in pending status' });
    return;
  }
  res.json({ success: true, data: schedule });
});

export default router;
