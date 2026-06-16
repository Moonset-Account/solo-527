const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/stats', authMiddleware, dashboardController.getDashboardStats);
router.get('/activities', authMiddleware, dashboardController.getRecentActivities);
router.post('/run-rules', authMiddleware, dashboardController.runReminderRules);

module.exports = router;
