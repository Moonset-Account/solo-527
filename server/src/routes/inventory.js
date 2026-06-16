const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, inventoryController.getInventoryList);
router.get('/low-stock', authMiddleware, inventoryController.getLowStockItems);
router.get('/:id', authMiddleware, inventoryController.getInventoryById);
router.post('/', authMiddleware, inventoryController.createInventory);
router.put('/:id', authMiddleware, inventoryController.updateInventory);
router.put('/:id/restock', authMiddleware, inventoryController.restockInventory);
router.put('/:id/consume', authMiddleware, inventoryController.consumeInventory);
router.delete('/:id', authMiddleware, inventoryController.deleteInventory);

module.exports = router;
