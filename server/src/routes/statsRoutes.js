const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { auth } = require('../middleware/auth');

router.get('/dashboard', auth, statsController.getDashboardStats);
router.get('/event-trend', auth, statsController.getEventTrendStats);
router.get('/event-type', auth, statsController.getEventTypeStats);
router.get('/event-by-grid', auth, statsController.getEventByGridStats);

module.exports = router;
