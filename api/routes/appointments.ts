import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleCheck, type AuthRequest } from '../middleware/auth.js';
import * as appointmentService from '../services/appointmentService.js';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const filters: Record<string, unknown> = {};
  if (req.query.member_id) filters.member_id = parseInt(req.query.member_id as string);
  if (req.query.coach_id) filters.coach_id = parseInt(req.query.coach_id as string);
  if (req.query.status) filters.status = req.query.status as string;
  if (req.query.date) filters.date = req.query.date as string;
  const appointments = appointmentService.listAppointments(filters);
  res.json({ success: true, data: appointments });
});

router.post('/', authMiddleware, roleCheck('admin', 'receptionist', 'coach'), async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'MEMBER_FROZEN') {
      res.status(400).json({ success: false, error: 'Member is frozen and cannot book appointments' });
      return;
    }
    if (msg === 'NO_REMAINING_SESSIONS') {
      res.status(400).json({ success: false, error: 'No remaining sessions in package' });
      return;
    }
    if (msg === 'COACH_TIME_CONFLICT') {
      res.status(409).json({ success: false, error: 'Coach has a time conflict' });
      return;
    }
    if (msg === 'MEMBER_NOT_FOUND' || msg === 'PACKAGE_NOT_FOUND' || msg === 'PACKAGE_NOT_ACTIVE' || msg === 'PACKAGE_NOT_BELONG_TO_MEMBER' || msg === 'PACKAGE_REQUIRED') {
      res.status(400).json({ success: false, error: msg });
      return;
    }
    res.status(400).json({ success: false, error: msg });
  }
});

router.put('/:id', authMiddleware, roleCheck('admin', 'receptionist', 'coach'), (req: Request, res: Response): void => {
  const appointment = appointmentService.updateAppointment(parseInt(req.params.id), req.body);
  if (!appointment) {
    res.status(404).json({ success: false, error: 'Appointment not found' });
    return;
  }
  res.json({ success: true, data: appointment });
});

router.delete('/:id', authMiddleware, roleCheck('admin', 'receptionist'), (req: Request, res: Response): void => {
  const deleted = appointmentService.deleteAppointment(parseInt(req.params.id));
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Appointment not found' });
    return;
  }
  res.json({ success: true, message: 'Appointment deleted' });
});

router.post('/:id/checkin', authMiddleware, roleCheck('admin', 'receptionist', 'coach'), async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await appointmentService.checkInAppointment(parseInt(req.params.id));
    res.json({ success: true, data: appointment });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }
    if (msg === 'INVALID_STATUS') {
      res.status(400).json({ success: false, error: 'Appointment is not in booked status' });
      return;
    }
    if (msg === 'NO_REMAINING_SESSIONS') {
      res.status(400).json({ success: false, error: 'No remaining sessions in package' });
      return;
    }
    res.status(400).json({ success: false, error: msg });
  }
});

export default router;
