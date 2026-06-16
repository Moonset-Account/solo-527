import { Router } from 'express';
import { auth, requireRole, WRITE_ROLES } from '../middleware/auth.js';
import {
  getBatchList,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  getNearExpiryBatches,
  getExpiredBatches,
  adjustBatchStatus,
  exportBatches,
} from '../controllers/batches.js';

const router = Router();

router.get('/', auth, getBatchList);
router.get('/near-expiry', auth, getNearExpiryBatches);
router.get('/expired', auth, getExpiredBatches);
router.get('/export', auth, exportBatches);
router.get('/:id', auth, getBatchById);
router.post('/', auth, requireRole(...WRITE_ROLES), createBatch);
router.put('/:id', auth, requireRole(...WRITE_ROLES), updateBatch);
router.delete('/:id', auth, requireRole(...WRITE_ROLES), deleteBatch);
router.post('/:id/adjust-status', auth, requireRole(...WRITE_ROLES), adjustBatchStatus);

export default router;
