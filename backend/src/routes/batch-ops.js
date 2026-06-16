import { Router } from 'express';
import { auth, requireRole, ROLE, WRITE_ROLES, ALL_INTERNAL_ROLES } from '../middleware/auth.js';
import {
  getBatchOps,
  previewBatchOp,
  confirmBatchOp,
  getBatchOpDetail,
} from '../controllers/batchOps.js';

const router = Router();

router.use(auth);

router.get('/', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), getBatchOps);
router.post('/preview', requireRole(...WRITE_ROLES), previewBatchOp);
router.post('/confirm', requireRole(...WRITE_ROLES), confirmBatchOp);
router.get('/:id', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), getBatchOpDetail);

export default router;
