const express = require('express');
const router = express.Router();
const anomalyController = require('../controllers/anomalyController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, anomalyController.getAnomalyList);
router.get('/:id', authMiddleware, anomalyController.getAnomalyById);
router.post('/', authMiddleware, anomalyController.createAnomaly);
router.put('/:id', authMiddleware, anomalyController.updateAnomaly);
router.put('/:id/resolve', authMiddleware, anomalyController.resolveAnomaly);
router.delete('/:id', authMiddleware, anomalyController.deleteAnomaly);

module.exports = router;
