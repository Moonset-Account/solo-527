import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth.js';
import * as renewalService from '../services/renewalService.js';

const router = Router();

router.get('/funnel', authMiddleware, roleCheck('admin', 'receptionist'), (_req: Request, res: Response): void => {
  const funnel = renewalService.getRenewalFunnel();
  res.json({ success: true, data: funnel });
});

router.get('/expiring', authMiddleware, roleCheck('admin', 'receptionist'), (_req: Request, res: Response): void => {
  const packages = renewalService.listExpiringPackages();
  res.json({ success: true, data: packages });
});

router.put('/:id/follow-up', authMiddleware, roleCheck('admin', 'receptionist'), (req: Request, res: Response): void => {
  const { notes } = req.body;
  if (!notes) {
    res.status(400).json({ success: false, error: 'Notes required' });
    return;
  }
  const tracking = renewalService.addFollowUpNotes(parseInt(req.params.id), notes);
  if (!tracking) {
    res.status(404).json({ success: false, error: 'Renewal tracking not found' });
    return;
  }
  res.json({ success: true, data: tracking });
});

export default router;
