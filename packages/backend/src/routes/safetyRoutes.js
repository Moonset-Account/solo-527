const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/safetyController');
const { auth } = require('../middleware/auth');

router.get('/', safetyController.getReminders);
router.get('/:id', safetyController.getReminder);

router.use(auth);
router.post('/', safetyController.createReminder);
router.put('/:id', safetyController.updateReminder);
router.delete('/:id', safetyController.deleteReminder);

module.exports = router;
