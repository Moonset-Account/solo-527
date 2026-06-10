const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, eventController.getEvents);
router.get('/statistics', auth, eventController.getEventStatistics);
router.get('/trend', auth, eventController.getEventTrend);
router.get('/:id', auth, eventController.getEventById);
router.post('/', auth, eventController.createEvent);
router.post('/batch-withdraw', auth, requireRole('ADMIN'), eventController.batchWithdrawEvents);
router.put('/:id', auth, eventController.updateEvent);
router.post('/:id/assign', auth, requireRole('ADMIN'), eventController.assignEvent);
router.put('/:id/status', auth, eventController.updateEventStatus);
router.post('/:id/close', auth, requireRole('ADMIN'), eventController.closeEvent);
router.post('/:id/process-facility-damage', auth, eventController.processFacilityDamage);
router.delete('/:id', auth, requireRole('ADMIN'), eventController.deleteEvent);

module.exports = router;
