const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');
const { roleMiddleware } = require('../middleware/permissions');

router.get('/notifications', authMiddleware, notificationController.getMyNotifications);
router.get('/notifications/unread-count', authMiddleware, notificationController.getUnreadCount);
router.put('/notifications/:id/read', authMiddleware, notificationController.markAsRead);
router.put('/notifications/read-all', authMiddleware, notificationController.markAllAsRead);
router.get('/audit-logs', authMiddleware, roleMiddleware(['admin']), notificationController.getAuditLogs);
router.get('/statistics', authMiddleware, roleMiddleware(['admin', 'volunteer']), notificationController.getStatistics);

module.exports = router;
