const express = require('express');
const router = express.Router();
const cashDifferenceController = require('../controllers/cashDifferenceController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, cashDifferenceController.getCashDifferenceList);
router.get('/stats', authMiddleware, cashDifferenceController.getCashStatistics);
router.get('/:id', authMiddleware, cashDifferenceController.getCashDifferenceById);
router.post('/', authMiddleware, cashDifferenceController.createCashDifference);
router.put('/:id', authMiddleware, cashDifferenceController.updateCashDifference);
router.put('/:id/handle', authMiddleware, cashDifferenceController.handleCashDifference);
router.delete('/:id', authMiddleware, cashDifferenceController.deleteCashDifference);

module.exports = router;
