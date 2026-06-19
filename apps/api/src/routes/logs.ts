import { Router, Request, Response } from 'express';
import { validateQuery } from '../middleware/validate';
import { AuditLogQuerySchema, OperationLogQuerySchema } from '@seat-platform/shared';
import * as logService from '../services/logService';

const router = Router();

router.get('/audit', validateQuery(AuditLogQuerySchema), async (req: Request, res: Response) => {
  const query = req.query as unknown as Parameters<typeof logService.listAuditLogs>[0];
  const result = await logService.listAuditLogs(query);
  res.json(result);
});

router.get('/operations', validateQuery(OperationLogQuerySchema), async (req: Request, res: Response) => {
  const query = req.query as unknown as Parameters<typeof logService.listOperationLogs>[0];
  const result = await logService.listOperationLogs(query);
  res.json(result);
});

export default router;
