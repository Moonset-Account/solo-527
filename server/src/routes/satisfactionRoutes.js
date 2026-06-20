const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const satisfactionController = require('../controllers/satisfactionController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

router.get('/', authMiddleware, satisfactionController.getSatisfactionSurveys);

router.get('/:id', authMiddleware, satisfactionController.getSatisfactionById);

router.post('/', [
  body('orderId').notEmpty().withMessage('订单ID不能为空'),
  body('overallRating').isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间').toInt(),
  validateRequest
], satisfactionController.createSatisfaction);

router.put('/:id', authMiddleware, satisfactionController.updateSatisfaction);

router.put('/:id/visit', authMiddleware, requireRole('super_admin', 'store_manager', 'customer_service'), [
  body('visitStatus').notEmpty().withMessage('回访状态不能为空'),
  validateRequest
], satisfactionController.updateVisitStatus);

router.put('/:id/followup', authMiddleware, requireRole('super_admin', 'store_manager', 'customer_service'), [
  body('followUpStatus').notEmpty().withMessage('跟进状态不能为空'),
  validateRequest
], satisfactionController.updateFollowUp);

module.exports = router;
