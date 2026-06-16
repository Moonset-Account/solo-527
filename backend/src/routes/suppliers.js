import { Router } from 'express';
import { auth, requireRole, WRITE_ROLES, ALL_INTERNAL_ROLES, ROLE } from '../middleware/auth.js';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierRatings,
  rateSupplier,
  getSupplierProducts,
  getSupplierStatistics,
} from '../controllers/suppliers.js';

const router = Router();

router.get('/', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), getSuppliers);
router.get('/:id/ratings', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), getSupplierRatings);
router.get('/:id/products', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), getSupplierProducts);
router.get('/:id/statistics', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), getSupplierStatistics);
router.get('/:id', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), getSupplierById);
router.post('/', auth, requireRole(...WRITE_ROLES), createSupplier);
router.post('/:id/rate', auth, requireRole(...WRITE_ROLES), rateSupplier);
router.put('/:id', auth, requireRole(...WRITE_ROLES), updateSupplier);
router.delete('/:id', auth, requireRole(ROLE.SUPER_ADMIN), deleteSupplier);

export default router;
