const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const serviceController = require('../controllers/serviceController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

router.get('/', authMiddleware, serviceController.getServices);

router.get('/category/:category', serviceController.getServicesByCategory);

router.get('/:id', authMiddleware, serviceController.getServiceById);

router.post('/', authMiddleware, requireRole('super_admin', 'store_manager'), [
  body('name').notEmpty().withMessage('服务名称不能为空'),
  body('category').notEmpty().withMessage('服务分类不能为空'),
  body('basePrice').isNumeric().withMessage('基础价格必须是数字').toFloat(),
  validateRequest
], serviceController.createService);

router.put('/:id', authMiddleware, requireRole('super_admin', 'store_manager'), [
  body('name').optional().notEmpty().withMessage('服务名称不能为空'),
  body('basePrice').optional().isNumeric().withMessage('基础价格必须是数字').toFloat(),
  validateRequest
], serviceController.updateService);

router.delete('/:id', authMiddleware, requireRole('super_admin'), serviceController.deleteService);

module.exports = router;
