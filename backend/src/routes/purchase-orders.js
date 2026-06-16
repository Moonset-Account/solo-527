import { Router } from 'express';
import { auth, requireRole, WRITE_ROLES, ROLE } from '../middleware/auth.js';
import {
  getPurchaseOrderList,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  updatePurchaseOrderStatus,
  submitPurchaseOrder,
  confirmPurchaseOrder,
  cancelPurchaseOrder,
  exportPurchaseOrders,
} from '../controllers/purchaseOrders.js';

const router = Router();

router.get('/', auth, getPurchaseOrderList);
router.get('/export', auth, exportPurchaseOrders);
router.get('/:id', auth, getPurchaseOrderById);
router.post('/', auth, requireRole(...WRITE_ROLES), createPurchaseOrder);
router.put('/:id', auth, requireRole(...WRITE_ROLES), updatePurchaseOrder);
router.delete('/:id', auth, requireRole(ROLE.SUPER_ADMIN, ROLE.PURCHASE_STAFF), deletePurchaseOrder);
router.patch('/:id/status', auth, requireRole(...WRITE_ROLES), updatePurchaseOrderStatus);
router.post('/:id/submit', auth, requireRole(...WRITE_ROLES), submitPurchaseOrder);
router.post('/:id/confirm', auth, requireRole(ROLE.SUPER_ADMIN, ROLE.PURCHASE_STAFF, ROLE.SUPPLIER), confirmPurchaseOrder);
router.post('/:id/cancel', auth, requireRole(...WRITE_ROLES), cancelPurchaseOrder);

export default router;
