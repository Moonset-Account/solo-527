import { Router } from 'express';
import { auth, requireRole, WRITE_ROLES, ROLE } from '../middleware/auth.js';
import {
  getOutboundOrders,
  getOutboundOrderById,
  createOutboundOrder,
  updateOutboundOrder,
  deleteOutboundOrder,
  updateOutboundStatus,
  scanOutboundItem,
  completeOutboundOrder,
} from '../controllers/outboundOrders.js';

const router = Router();

router.use(auth);

router.get('/', getOutboundOrders);
router.get('/:id', getOutboundOrderById);

router.post('/', requireRole(...WRITE_ROLES), createOutboundOrder);
router.put('/:id', requireRole(...WRITE_ROLES), updateOutboundOrder);
router.delete('/:id', requireRole(ROLE.SUPER_ADMIN, ROLE.WAREHOUSE_MANAGER), deleteOutboundOrder);

router.patch('/:id/status', requireRole(...WRITE_ROLES), updateOutboundStatus);
router.post('/:id/scan-item', requireRole(ROLE.SUPER_ADMIN, ROLE.WAREHOUSE_MANAGER), scanOutboundItem);
router.post('/:id/complete', requireRole(...WRITE_ROLES), completeOutboundOrder);

export default router;
