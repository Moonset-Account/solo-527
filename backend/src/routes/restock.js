import { Router } from 'express';
import { auth, requireRole, ROLE, WRITE_ROLES, ALL_INTERNAL_ROLES } from '../middleware/auth.js';
import {
  getRestockSuggestions,
  generateRestockSuggestions,
  handleSuggestionAction,
} from '../controllers/restock.js';

const router = Router();

router.use(auth);

router.get('/', requireRole(...ALL_INTERNAL_ROLES, ROLE.VIEWER), getRestockSuggestions);
router.post('/generate', requireRole(ROLE.SUPER_ADMIN, ROLE.WAREHOUSE_MANAGER, ROLE.PURCHASE_STAFF), generateRestockSuggestions);
router.post('/:id/action', requireRole(ROLE.SUPER_ADMIN, ROLE.WAREHOUSE_MANAGER, ROLE.PURCHASE_STAFF), handleSuggestionAction);

export default router;
