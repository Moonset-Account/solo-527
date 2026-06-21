const express = require('express');
const router = express.Router();
const batchImportController = require('../controllers/batchImportController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', batchImportController.getBatchImports);
router.get('/:id', batchImportController.getBatchImportById);
router.post('/', batchImportController.createBatchImport);
router.delete('/:id', batchImportController.deleteBatchImport);
router.get('/:id/errors/download', batchImportController.downloadErrors);
router.post('/:id/retry', batchImportController.retryFailedItems);

module.exports = router;
