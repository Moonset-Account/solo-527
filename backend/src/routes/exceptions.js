import { Router } from 'express';
import { auth, requireRole, WRITE_ROLES, ROLE } from '../middleware/auth.js';
import {
  getExceptions,
  getExceptionById,
  createException,
  updateException,
  deleteException,
  updateExceptionStatus,
  assignException,
  getExceptionStatistics,
} from '../controllers/exceptions.js';

const router = Router();

router.use(auth);

router.get('/', getExceptions);
router.get('/statistics', getExceptionStatistics);
router.get('/:id', getExceptionById);

router.post('/', requireRole(...WRITE_ROLES), createException);
router.put('/:id', requireRole(...WRITE_ROLES), updateException);
router.delete('/:id', requireRole(ROLE.SUPER_ADMIN, ROLE.WAREHOUSE_MANAGER), deleteException);

router.patch('/:id/status', requireRole(...WRITE_ROLES), updateExceptionStatus);
router.post('/:id/assign', requireRole(ROLE.SUPER_ADMIN, ROLE.WAREHOUSE_MANAGER), assignException);

export default router;
