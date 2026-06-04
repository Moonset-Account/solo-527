import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleCheck, type AuthRequest } from '../middleware/auth.js';
import * as coachService from '../services/coachService.js';
import * as scheduleService from '../services/scheduleService.js';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const status = req.query.status as string | undefined;
  const coaches = coachService.listCoaches(status);
  res.json({ success: true, data: coaches });
});

router.post('/', authMiddleware, roleCheck('admin'), (req: Request, res: Response): void => {
  try {
    const coach = coachService.createCoach(req.body);
    res.status(201).json({ success: true, data: coach });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  const coach = coachService.getCoach(parseInt(req.params.id));
  if (!coach) {
    res.status(404).json({ success: false, error: 'Coach not found' });
    return;
  }
  res.json({ success: true, data: coach });
});

router.put('/:id', authMiddleware, roleCheck('admin'), (req: Request, res: Response): void => {
  const coach = coachService.updateCoach(parseInt(req.params.id), req.body);
  if (!coach) {
    res.status(404).json({ success: false, error: 'Coach not found' });
    return;
  }
  res.json({ success: true, data: coach });
});

router.get('/:id/performance', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const performance = coachService.getCoachPerformance(parseInt(req.params.id), req.user!);
    res.json({ success: true, data: performance });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'FORBIDDEN') {
      res.status(403).json({ success: false, error: 'You can only view your own performance data' });
      return;
    }
    if (msg === 'NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Coach not found' });
      return;
    }
    res.status(400).json({ success: false, error: msg });
  }
});

router.get('/:id/schedule', authMiddleware, (req: Request, res: Response): void => {
  const startDate = req.query.start_date as string || new Date().toISOString().slice(0, 10);
  const endDate = req.query.end_date as string || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const schedules = scheduleService.getCoachSchedule(parseInt(req.params.id), startDate, endDate);
  res.json({ success: true, data: schedules });
});

router.post('/:id/schedule', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const schedule = scheduleService.createSchedule({
      coach_id: parseInt(req.params.id),
      ...req.body,
    });
    res.status(201).json({ success: true, data: schedule });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

export default router;
