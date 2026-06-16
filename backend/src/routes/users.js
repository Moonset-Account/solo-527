import { Router } from 'express';
import { auth, requireRole, WRITE_ROLES } from '../middleware/auth.js';
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus,
} from '../controllers/users.js';

const router = Router();

router.get('/', auth, getUsers);
router.post('/', auth, requireRole(...WRITE_ROLES), createUser);
router.get('/:id', auth, getUserById);
router.put('/:id', auth, requireRole(...WRITE_ROLES), updateUser);
router.patch('/:id/status', auth, requireRole(...WRITE_ROLES), updateUserStatus);

export default router;
