const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pricingRuleController = require('../controllers/pricingRuleController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

router.get('/', authMiddleware, pricingRuleController.getPricingRules);

router.get('/:id', authMiddleware, pricingRuleController.getPricingRuleById);

router.post('/calculate', pricingRuleController.calculatePrice);

router.post('/', authMiddleware, requireRole('super_admin', 'store_manager'), [
  body('name').notEmpty().withMessage('规则名称不能为空'),
  body('ruleType').notEmpty().withMessage('规则类型不能为空'),
  validateRequest
], pricingRuleController.createPricingRule);

router.put('/:id', authMiddleware, requireRole('super_admin', 'store_manager'), [
  body('name').optional().notEmpty().withMessage('规则名称不能为空'),
  validateRequest
], pricingRuleController.updatePricingRule);

router.delete('/:id', authMiddleware, requireRole('super_admin'), pricingRuleController.deletePricingRule);

module.exports = router;
