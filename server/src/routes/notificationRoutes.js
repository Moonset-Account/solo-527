const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, notificationController.getNotifications);
router.get('/unread-count', auth, notificationController.getUnreadCount);
router.get('/:id', auth, notificationController.getNotificationById);
router.post('/', auth, requireRole('ADMIN'), notificationController.createNotification);
router.put('/:id/read', auth, notificationController.markAsRead);
router.post('/read-all', auth, notificationController.markAllAsRead);
router.delete('/:id', auth, notificationController.deleteNotification);

module.exports = router;
