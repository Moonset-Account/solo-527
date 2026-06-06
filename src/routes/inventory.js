const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

router.get('/supply-items', authenticateToken, checkPermission('INVENTORY_VIEW'), inventoryController.getSupplyItems);
router.get('/supply-items/:id', authenticateToken, checkPermission('INVENTORY_VIEW'), inventoryController.getSupplyItemById);
router.get('/batches', authenticateToken, checkPermission('INVENTORY_VIEW'), inventoryController.getBatches);
router.post('/batches', authenticateToken, checkPermission('BATCH_MANAGE'), inventoryController.createBatch);
router.get('/batches/verify/:batchNo', authenticateToken, checkPermission('INVENTORY_VIEW'), inventoryController.verifyBatch);
router.get('/batches/verify/:batchNo/:supplyItemId', authenticateToken, checkPermission('INVENTORY_VIEW'), inventoryController.verifyBatch);
router.get('/ledger', authenticateToken, checkPermission('INVENTORY_VIEW'), inventoryController.getInventoryLedger);
router.get('/stock-alerts', authenticateToken, checkPermission('INVENTORY_VIEW'), inventoryController.getStockAlerts);
router.get('/operating-rooms', authenticateToken, inventoryController.getOperatingRooms);
router.get('/surgery-types', authenticateToken, inventoryController.getSurgeryTypes);
router.get('/package-templates', authenticateToken, inventoryController.getPackageTemplates);
router.get('/package-templates/:id', authenticateToken, inventoryController.getPackageTemplateById);

module.exports = router;
