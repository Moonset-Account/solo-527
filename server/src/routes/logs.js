const express = require('express');
const router = express.Router();
const operationLogController = require('../controllers/operationLogController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

router.get('/', authMiddleware, requireRole('admin', 'manager'), operationLogController.getLogs);
router.get('/stats', authMiddleware, requireRole('admin', 'manager'), operationLogController.getModuleStats);
router.get('/:id', authMiddleware, requireRole('admin', 'manager'), operationLogController.getLogById);

module.exports = router;
