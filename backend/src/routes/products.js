const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/stock/summary', productController.getStockSummary);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.post('/:id/stock-adjust', productController.adjustStock);

module.exports = router;
