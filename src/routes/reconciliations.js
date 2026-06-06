const express = require('express');
const router = express.Router();
const reconciliationController = require('../controllers/reconciliationController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

router.get('/', authenticateToken, checkPermission('RECONCILIATION_VIEW'), reconciliationController.getReconciliations);
router.post('/generate', authenticateToken, checkPermission('RECONCILIATION_MANAGE'), reconciliationController.generateReconciliation);
router.put('/:id', authenticateToken, checkPermission('RECONCILIATION_MANAGE'), reconciliationController.updateReconciliation);
router.post('/submit', authenticateToken, checkPermission('RECONCILIATION_MANAGE'), reconciliationController.submitReconciliation);
router.post('/verify', authenticateToken, checkPermission('RECONCILIATION_MANAGE'), reconciliationController.verifyReconciliation);

module.exports = router;
