import { Router, Request, Response } from 'express';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  CreateReminderSchema,
  BatchSendReminderSchema,
  ReminderQuerySchema,
} from '@seat-platform/shared';
import * as reminderService from '../services/reminderService';

const router = Router();

router.get('/', validateQuery(ReminderQuerySchema), async (req: Request, res: Response) => {
  const query = req.query as unknown as Parameters<typeof reminderService.listReminders>[0];
  const result = await reminderService.listReminders(query);
  res.json(result);
});

router.get('/batches', async (req: Request, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10);
  const pageSize = parseInt(String(req.query.pageSize || '20'), 10);
  const result = await reminderService.getReminderBatches(page, pageSize);
  res.json(result);
});

router.get('/:id', async (req: Request, res: Response) => {
  const reminder = await reminderService.getReminderById(req.params.id);
  if (!reminder) {
    return res.status(404).json({ message: '提醒不存在' });
  }
  res.json(reminder);
});

router.post('/', validateBody(CreateReminderSchema), async (req: Request, res: Response) => {
  const reminder = await reminderService.createReminder(req.body);
  res.status(201).json(reminder);
});

router.post('/batch', validateBody(BatchSendReminderSchema), async (req: Request, res: Response) => {
  const batch = await reminderService.batchSendReminders(req.body);
  res.status(201).json(batch);
});

router.post('/:id/dismiss', async (req: Request, res: Response) => {
  const reminder = await reminderService.dismissReminder(req.params.id);
  if (!reminder) {
    return res.status(404).json({ message: '提醒不存在' });
  }
  res.json(reminder);
});

export default router;
