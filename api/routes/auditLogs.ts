import { Router, type Request, type Response } from 'express';
import { authMiddleware, roleCheck } from '../middleware/auth.js';
import * as auditService from '../services/auditService.js';

const router = Router();

router.get('/', authMiddleware, roleCheck('admin'), (req: Request, res: Response): void => {
  const filters: Record<string, unknown> = {};
  if (req.query.entity_type) filters.entity_type = req.query.entity_type as string;
  if (req.query.entity_id) filters.entity_id = parseInt(req.query.entity_id as string);
  if (req.query.user_id) filters.user_id = parseInt(req.query.user_id as string);
  if (req.query.start_date) filters.start_date = req.query.start_date as string;
  if (req.query.end_date) filters.end_date = req.query.end_date as string;
  if (req.query.page) filters.page = parseInt(req.query.page as string);
  if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
  const result = auditService.queryAuditLogs(filters);
  res.json({ success: true, data: result.logs, total: result.total });
});

export default router;
