import { Router, Request, Response } from 'express';
import { validateBody, validateQuery } from '../middleware/validate';
import { UsageTrendQuerySchema } from '@seat-platform/shared';
import * as usageService from '../services/usageService';
import * as seatService from '../services/seatService';

const router = Router();

router.get('/trend', validateQuery(UsageTrendQuerySchema), async (req: Request, res: Response) => {
  const query = req.query as unknown as Parameters<typeof usageService.getUsageTrend>[0];
  const result = await usageService.getUsageTrend(query);
  res.json(result);
});

router.get('/abnormal', async (req: Request, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10);
  const pageSize = parseInt(String(req.query.pageSize || '20'), 10);
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const seatId = req.query.seatId as string | undefined;

  const result = await usageService.listAbnormalRecords(page, pageSize, startDate, endDate, seatId);
  res.json(result);
});

router.get('/seats/:seatId', async (req: Request, res: Response) => {
  const seat = await seatService.getSeatById(req.params.seatId);
  if (!seat) {
    return res.status(404).json({ message: '席位不存在' });
  }

  const page = parseInt(String(req.query.page || '1'), 10);
  const pageSize = parseInt(String(req.query.pageSize || '20'), 10);
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  const result = await usageService.listUsageRecords(req.params.seatId, page, pageSize, startDate, endDate);
  res.json(result);
});

router.post('/ingest', async (req: Request, res: Response) => {
  const result = await usageService.createUsageRecord(req.body);
  res.status(201).json(result);
});

export default router;
