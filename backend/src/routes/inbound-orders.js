import { Router } from 'express';
import { auth, requireRole, WRITE_ROLES, ROLE } from '../middleware/auth.js';
import {
  getInboundOrders,
  getInboundOrderById,
  createInboundOrder,
  updateInboundOrder,
  deleteInboundOrder,
  updateInboundStatus,
  scanInboundItem,
  qcInboundOrder,
  completeInboundOrder,
  exportInboundOrders,
} from '../controllers/inboundOrders.js';

const router = Router();

router.use(auth);

router.get('/', getInboundOrders);
router.get('/export', exportInboundOrders);
router.get('/:id', getInboundOrderById);

router.post('/', requireRole(...WRITE_ROLES), createInboundOrder);
router.put('/:id', requireRole(...WRITE_ROLES), updateInboundOrder);
router.delete('/:id', requireRole(ROLE.SUPER_ADMIN, ROLE.WAREHOUSE_MANAGER), deleteInboundOrder);

router.patch('/:id/status', requireRole(...WRITE_ROLES), updateInboundStatus);
router.post('/:id/scan-item', requireRole(ROLE.SUPER_ADMIN, ROLE.WAREHOUSE_MANAGER, ROLE.QC_STAFF), scanInboundItem);
router.post('/:id/qc', requireRole(ROLE.SUPER_ADMIN, ROLE.QC_STAFF), qcInboundOrder);
router.post('/:id/complete', requireRole(...WRITE_ROLES), completeInboundOrder);

export default router;
