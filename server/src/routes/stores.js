const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

router.get('/', authMiddleware, storeController.getStores);
router.get('/:id', authMiddleware, storeController.getStoreById);
router.post('/', authMiddleware, requireRole('admin', 'manager'), storeController.createStore);
router.put('/:id', authMiddleware, requireRole('admin', 'manager'), storeController.updateStore);
router.delete('/:id', authMiddleware, requireRole('admin'), storeController.deleteStore);

module.exports = router;
