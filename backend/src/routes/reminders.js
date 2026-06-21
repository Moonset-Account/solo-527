const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', reminderController.getReminders);
router.get('/stats/summary', reminderController.getReminderStats);
router.get('/:id', reminderController.getReminderById);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.post('/:id/handle', reminderController.handleReminder);
router.delete('/:id', reminderController.deleteReminder);
router.post('/generate', reminderController.generateReminders);

module.exports = router;
