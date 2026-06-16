const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, businessController.getBusinessDataList);
router.get('/profit-stats', authMiddleware, businessController.getProfitStatistics);
router.get('/:id', authMiddleware, businessController.getBusinessDataById);
router.post('/', authMiddleware, businessController.createBusinessData);
router.put('/:id', authMiddleware, businessController.updateBusinessData);
router.delete('/:id', authMiddleware, businessController.deleteBusinessData);

module.exports = router;
