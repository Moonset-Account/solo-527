import { Router } from 'express';
import { auth, requireRole, WRITE_ROLES, ALL_INTERNAL_ROLES, ROLE } from '../middleware/auth.js';
import {
  getProducts,
  getProductById,
  getProductByBarcode,
  getLowStockProducts,
  getProductsWithSuppliers,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/products.js';

const router = Router();

router.get('/', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), getProducts);
router.get('/by-barcode/:code', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), getProductByBarcode);
router.get('/low-stock', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), getLowStockProducts);
router.get('/with-suppliers', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), getProductsWithSuppliers);
router.get('/:id', auth, requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER, ROLE.SUPPLIER), getProductById);
router.post('/', auth, requireRole(...WRITE_ROLES), createProduct);
router.put('/:id', auth, requireRole(...WRITE_ROLES), updateProduct);
router.delete('/:id', auth, requireRole(ROLE.SUPER_ADMIN, ROLE.WAREHOUSE_MANAGER), deleteProduct);

export default router;
