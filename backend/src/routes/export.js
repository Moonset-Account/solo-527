import { Router } from 'express';
import { auth, requireRole, ROLE, ALL_INTERNAL_ROLES } from '../middleware/auth.js';
import {
  exportInventory,
  exportBatches,
  exportPurchase,
  exportInbound,
  exportException,
} from '../controllers/export.js';

const router = Router();

router.use(auth);

router.post('/inventory', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), exportInventory);
router.post('/batches', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), exportBatches);
router.post('/purchase', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), exportPurchase);
router.post('/inbound', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), exportInbound);
router.post('/exception', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), exportException);

export default router;
