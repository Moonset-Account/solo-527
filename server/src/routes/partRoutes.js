const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const partController = require('../controllers/partController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

router.get('/', authMiddleware, partController.getParts);

router.get('/:id', authMiddleware, partController.getPartById);

router.post('/', authMiddleware, requireRole('super_admin', 'store_manager'), [
  body('name').notEmpty().withMessage('配件名称不能为空'),
  body('category').notEmpty().withMessage('配件分类不能为空'),
  body('costPrice').isNumeric().withMessage('成本价必须是数字').toFloat(),
  body('salePrice').isNumeric().withMessage('销售价必须是数字').toFloat(),
  validateRequest
], partController.createPart);

router.put('/:id', authMiddleware, requireRole('super_admin', 'store_manager'), [
  body('name').optional().notEmpty().withMessage('配件名称不能为空'),
  validateRequest
], partController.updatePart);

router.delete('/:id', authMiddleware, requireRole('super_admin'), partController.deletePart);

router.post('/:id/stock', authMiddleware, requireRole('super_admin', 'store_manager'), [
  body('quantity').isNumeric().withMessage('数量必须是数字').toInt(),
  body('type').isIn(['in', 'out', 'set']).withMessage('类型不正确'),
  validateRequest
], partController.updateStock);

module.exports = router;
