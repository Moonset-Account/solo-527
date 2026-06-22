import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get(
  '/',
  authMiddleware,
  roleMiddleware('SYS_ADMIN'),
  userController.getUserList
);
router.post(
  '/',
  authMiddleware,
  roleMiddleware('SYS_ADMIN'),
  userController.createUserValidators,
  userController.createUser
);
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('SYS_ADMIN'),
  userController.updateUser
);
router.get('/departments', authMiddleware, userController.getDepartmentList);

export default router;
