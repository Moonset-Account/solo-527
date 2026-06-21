const express = require('express');
const router = express.Router();
const damageReportController = require('../controllers/damageReportController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', damageReportController.getDamageReports);
router.get('/:id', damageReportController.getDamageReportById);
router.post('/', damageReportController.createDamageReport);
router.put('/:id', damageReportController.updateDamageReport);
router.post('/:id/approve', damageReportController.approveDamageReport);
router.post('/:id/reject', damageReportController.rejectDamageReport);
router.delete('/:id', damageReportController.deleteDamageReport);

module.exports = router;
