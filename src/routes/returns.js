const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

router.get('/', authenticateToken, checkPermission('RETURN_MANAGE'), returnController.getReturnRecords);
router.get('/:id', authenticateToken, checkPermission('RETURN_MANAGE'), returnController.getReturnRecordById);
router.post('/', authenticateToken, checkPermission('RETURN_MANAGE'), returnController.createReturnRecord);
router.post('/:id/check', authenticateToken, checkPermission('RETURN_MANAGE'), returnController.checkReturnRecord);

module.exports = router;
