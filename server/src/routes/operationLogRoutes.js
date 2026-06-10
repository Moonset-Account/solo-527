const express = require('express');
const router = express.Router();
const operationLogController = require('../controllers/operationLogController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, requireRole('ADMIN'), operationLogController.getOperationLogs);
router.get('/:id', auth, requireRole('ADMIN'), operationLogController.getOperationLogById);

module.exports = router;
