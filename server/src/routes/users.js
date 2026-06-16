const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

router.get('/', authMiddleware, requireRole('admin', 'manager'), userController.getUsers);
router.get('/:id', authMiddleware, userController.getUserById);
router.post('/', authMiddleware, requireRole('admin', 'manager'), userController.createUser);
router.put('/:id', authMiddleware, requireRole('admin', 'manager'), userController.updateUser);
router.delete('/:id', authMiddleware, requireRole('admin'), userController.deleteUser);
router.put('/:id/permissions', authMiddleware, requireRole('admin'), userController.updateUserPermissions);

module.exports = router;
