import { Router, Request, Response } from 'express';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  UpdatePaymentCallbackSchema,
  PaymentCallbackQuerySchema,
  RetryPaymentCallbackSchema,
} from '@seat-platform/shared';
import * as paymentService from '../services/paymentService';

const router = Router();

router.get('/', validateQuery(PaymentCallbackQuerySchema), async (req: Request, res: Response) => {
  const query = req.query as unknown as Parameters<typeof paymentService.listPaymentCallbacks>[0];
  const result = await paymentService.listPaymentCallbacks(query);
  res.json(result);
});

router.get('/statistics/risk', async (_req: Request, res: Response) => {
  const stats = await paymentService.getRiskStatistics();
  res.json(stats);
});

router.get('/:id', async (req: Request, res: Response) => {
  const record = await paymentService.getPaymentCallbackById(req.params.id);
  if (!record) {
    return res.status(404).json({ message: '支付回调记录不存在' });
  }
  res.json(record);
});

router.post('/callback', async (req: Request, res: Response) => {
  const record = await paymentService.recordPaymentCallback(req.body);
  res.status(201).json(record);
});

router.put('/:id', validateBody(UpdatePaymentCallbackSchema), async (req: Request, res: Response) => {
  const record = await paymentService.updatePaymentCallback(req.params.id, req.body);
  if (!record) {
    return res.status(404).json({ message: '支付回调记录不存在' });
  }
  res.json(record);
});

router.post('/:id/retry', validateBody(RetryPaymentCallbackSchema), async (req: Request, res: Response) => {
  const record = await paymentService.retryPaymentCallback(req.params.id, req.body.remark);
  if (!record) {
    return res.status(404).json({ message: '支付回调记录不存在' });
  }
  res.json(record);
});

export default router;
