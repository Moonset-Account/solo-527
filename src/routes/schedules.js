const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

router.get('/', authenticateToken, checkPermission('SCHEDULE_VIEW'), scheduleController.getSchedules);
router.get('/:id', authenticateToken, checkPermission('SCHEDULE_VIEW'), scheduleController.getScheduleById);
router.post('/', authenticateToken, checkPermission('SCHEDULE_MANAGE'), scheduleController.createSchedule);
router.put('/:id', authenticateToken, checkPermission('SCHEDULE_MANAGE'), scheduleController.updateSchedule);
router.post('/:id/cancel', authenticateToken, checkPermission('SCHEDULE_MANAGE'), scheduleController.cancelSchedule);

module.exports = router;
