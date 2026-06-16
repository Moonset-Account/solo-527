import { Router } from 'express';
import { auth, requireRole, WRITE_ROLES, ALL_INTERNAL_ROLES, ROLE } from '../middleware/auth.js';
import {
  getCategories,
  getCategoryById,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categories.js';

const router = Router();

router.get('/', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), getCategories);
router.get('/tree', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), getCategoryTree);
router.get('/:id', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), getCategoryById);
router.post('/', auth, requireRole(...WRITE_ROLES), createCategory);
router.put('/:id', auth, requireRole(...WRITE_ROLES), updateCategory);
router.delete('/:id', auth, requireRole(ROLE.SUPER_ADMIN, ROLE.WAREHOUSE_MANAGER), deleteCategory);

export default router;
