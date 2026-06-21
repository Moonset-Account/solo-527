const express = require('express');
const router = express.Router();
const reminderRuleController = require('../controllers/reminderRuleController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', reminderRuleController.getReminderRules);
router.get('/:id', reminderRuleController.getReminderRuleById);
router.post('/', reminderRuleController.createReminderRule);
router.put('/:id', reminderRuleController.updateReminderRule);
router.delete('/:id', reminderRuleController.deleteReminderRule);
router.post('/:id/toggle', reminderRuleController.toggleReminderRule);

module.exports = router;
