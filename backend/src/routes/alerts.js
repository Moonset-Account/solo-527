import { Router } from 'express';
import { auth, requireRole, ROLE, ALL_INTERNAL_ROLES } from '../middleware/auth.js';
import {
  getUnreadCount,
  getAlerts,
  markAsRead,
  markAllAsRead,
  deleteAlert,
} from '../controllers/alerts.js';

const router = Router();

router.use(auth);

router.get('/unread-count', requireRole(...Object.values(ROLE)), getUnreadCount);
router.get('/', requireRole(...Object.values(ROLE)), getAlerts);
router.patch('/:id/read', requireRole(...Object.values(ROLE)), markAsRead);
router.patch('/read-all', requireRole(...Object.values(ROLE)), markAllAsRead);
router.delete('/:id', requireRole(...Object.values(ROLE)), deleteAlert);

export default router;
