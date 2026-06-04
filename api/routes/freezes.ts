import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleCheck, type AuthRequest } from '../middleware/auth.js';
import * as freezeService from '../services/freezeService.js';

const router = Router();

router.get('/', authMiddleware, roleCheck('admin', 'receptionist'), (req: Request, res: Response): void => {
  const filters: Record<string, unknown> = {};
  if (req.query.member_id) filters.member_id = parseInt(req.query.member_id as string);
  if (req.query.status) filters.status = req.query.status as string;
  const freezes = freezeService.listFreezes(filters);
  res.json({ success: true, data: freezes });
});

router.post('/', authMiddleware, roleCheck('admin', 'receptionist', 'member'), async (req: Request, res: Response): Promise<void> => {
  try {
    const freeze = await freezeService.createFreeze(req.body);
    res.status(201).json({ success: true, data: freeze });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'MEMBER_NOT_FOUND' || msg === 'PACKAGE_NOT_FOUND' || msg === 'PACKAGE_NOT_BELONG_TO_MEMBER') {
      res.status(400).json({ success: false, error: msg });
      return;
    }
    res.status(400).json({ success: false, error: msg });
  }
});

router.put('/:id/approve', authMiddleware, roleCheck('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const freeze = await freezeService.approveFreeze(parseInt(req.params.id), req.user!.id);
    res.json({ success: true, data: freeze });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Freeze not found' });
      return;
    }
    if (msg === 'INVALID_STATUS') {
      res.status(400).json({ success: false, error: 'Freeze is not in pending status' });
      return;
    }
    res.status(400).json({ success: false, error: msg });
  }
});

router.put('/:id/reject', authMiddleware, roleCheck('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const freeze = await freezeService.rejectFreeze(parseInt(req.params.id), req.user!.id);
    res.json({ success: true, data: freeze });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Freeze not found' });
      return;
    }
    if (msg === 'INVALID_STATUS') {
      res.status(400).json({ success: false, error: 'Freeze is not in pending status' });
      return;
    }
    res.status(400).json({ success: false, error: msg });
  }
});

router.get('/members/:id/freezes', authMiddleware, (req: Request, res: Response): void => {
  const freezes = freezeService.getMemberFreezes(parseInt(req.params.id));
  res.json({ success: true, data: freezes });
});

export default router;
