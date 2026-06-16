const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, reminderController.getReminders);
router.get('/:id', authMiddleware, reminderController.getReminderById);
router.put('/:id/read', authMiddleware, reminderController.markAsRead);
router.put('/read-all', authMiddleware, reminderController.markAllAsRead);
router.put('/:id/process', authMiddleware, reminderController.processReminder);
router.put('/:id/dismiss', authMiddleware, reminderController.dismissReminder);
router.delete('/:id', authMiddleware, reminderController.deleteReminder);

module.exports = router;
