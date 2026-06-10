const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, userController.getUsers);
router.get('/:id', auth, userController.getUserById);
router.post('/', auth, requireRole('ADMIN'), userController.createUser);
router.put('/:id', auth, requireRole('ADMIN'), userController.updateUser);
router.delete('/:id', auth, requireRole('ADMIN'), userController.deleteUser);

module.exports = router;
