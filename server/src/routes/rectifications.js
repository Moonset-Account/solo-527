const express = require('express');
const router = express.Router();
const rectificationController = require('../controllers/rectificationController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, rectificationController.getTaskList);
router.get('/:id', authMiddleware, rectificationController.getTaskById);
router.post('/', authMiddleware, rectificationController.createTask);
router.put('/:id', authMiddleware, rectificationController.updateTask);
router.put('/:id/submit', authMiddleware, rectificationController.submitTask);
router.put('/:id/review', authMiddleware, rectificationController.reviewTask);
router.put('/:id/close', authMiddleware, rectificationController.closeTask);
router.delete('/:id', authMiddleware, rectificationController.deleteTask);

module.exports = router;
