import { Router } from 'express';
import { auth, requireRole, WRITE_ROLES } from '../middleware/auth.js';
import {
  getInventoryList,
  adjustInventory,
  batchAdjustInventory,
  getInventoryAlerts,
  exportInventory,
} from '../controllers/inventory.js';

const router = Router();

router.get('/', auth, getInventoryList);
router.put('/:id/adjust', auth, requireRole(...WRITE_ROLES), adjustInventory);
router.post('/batch-adjust', auth, requireRole(...WRITE_ROLES), batchAdjustInventory);
router.get('/alerts', auth, getInventoryAlerts);
router.get('/export', auth, exportInventory);

export default router;
