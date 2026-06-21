const express = require('express');
const router = express.Router();
const operationLogController = require('../controllers/operationLogController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', operationLogController.getOperationLogs);
router.get('/:id', operationLogController.getOperationLogById);

module.exports = router;
