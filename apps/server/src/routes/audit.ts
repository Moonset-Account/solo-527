import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getAuditLogs } from '../services/auditService';
import { getUserNotifications } from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/logs', authenticate, requireRole(['admin', 'warehouse_manager']), async (req, res) => {
  const { entityType, entityId, limit, offset } = req.query;
  
  const logs = await getAuditLogs(
    entityType as string,
    entityId as string,
    parseInt(limit as string) || 100,
    parseInt(offset as string) || 0
  );
  
  res.json(logs);
});

router.get('/notifications', authenticate, async (req: AuthRequest, res) => {
  const notifications = await getUserNotifications(req.user!.id);
  res.json(notifications);
});

export default router;
