import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth.js';
import * as bodyTestService from '../services/bodyTestService.js';

const router = Router();

router.get('/', authMiddleware, roleCheck('admin', 'coach'), (req: Request, res: Response): void => {
  const memberId = parseInt(req.query.member_id as string);
  if (!memberId) {
    res.status(400).json({ success: false, error: 'member_id query parameter required' });
    return;
  }
  const tests = bodyTestService.listBodyTestsForMember(memberId);
  res.json({ success: true, data: tests });
});

router.post('/', authMiddleware, roleCheck('admin', 'coach'), (req: Request, res: Response): void => {
  try {
    const test = bodyTestService.createBodyTest(req.body);
    res.status(201).json({ success: true, data: test });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.get('/members/:id/body-tests', authMiddleware, (req: Request, res: Response): void => {
  const tests = bodyTestService.listBodyTestsForMember(parseInt(req.params.id));
  res.json({ success: true, data: tests });
});

export default router;
