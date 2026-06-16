const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, inspectionController.getInspectionList);
router.get('/:id', authMiddleware, inspectionController.getInspectionById);
router.post('/', authMiddleware, inspectionController.createInspection);
router.put('/:id', authMiddleware, inspectionController.updateInspection);
router.put('/:id/start', authMiddleware, inspectionController.startInspection);
router.put('/:id/complete', authMiddleware, inspectionController.completeInspection);
router.delete('/:id', authMiddleware, inspectionController.deleteInspection);

module.exports = router;
