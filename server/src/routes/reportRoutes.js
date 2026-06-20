const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/dashboard', authMiddleware, reportController.getDashboardStats);

router.get('/price-transparency', authMiddleware, reportController.getPriceTransparencyReport);

router.get('/satisfaction', authMiddleware, reportController.getSatisfactionReport);

router.get('/sales', authMiddleware, reportController.getSalesReport);

router.get('/refund-reschedule', authMiddleware, reportController.getRefundRescheduleReport);

router.get('/technician-performance', authMiddleware, reportController.getTechnicianPerformanceReport);

module.exports = router;
