import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleCheck, type AuthRequest } from '../middleware/auth.js';
import * as memberService from '../services/memberService.js';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const status = req.query.status as string | undefined;
  const members = memberService.listMembers(status);
  res.json({ success: true, data: members });
});

router.post('/', authMiddleware, roleCheck('admin', 'receptionist'), (req: Request, res: Response): void => {
  try {
    const member = memberService.createMember(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  const member = memberService.getMember(parseInt(req.params.id));
  if (!member) {
    res.status(404).json({ success: false, error: 'Member not found' });
    return;
  }
  res.json({ success: true, data: member });
});

router.put('/:id', authMiddleware, roleCheck('admin', 'receptionist'), (req: Request, res: Response): void => {
  const member = memberService.updateMember(parseInt(req.params.id), req.body);
  if (!member) {
    res.status(404).json({ success: false, error: 'Member not found' });
    return;
  }
  res.json({ success: true, data: member });
});

router.delete('/:id', authMiddleware, roleCheck('admin'), (req: Request, res: Response): void => {
  const deleted = memberService.deleteMember(parseInt(req.params.id));
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Member not found' });
    return;
  }
  res.json({ success: true, message: 'Member deleted' });
});

export default router;
