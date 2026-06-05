const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { roleMiddleware } = require('../middleware/permissions');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/profile', authMiddleware, authController.updateProfile);
router.get('/users', authMiddleware, roleMiddleware(['admin', 'volunteer']), authController.getAllUsers);
router.put('/users/:id/verify', authMiddleware, roleMiddleware(['admin']), authController.verifyUser);

module.exports = router;
