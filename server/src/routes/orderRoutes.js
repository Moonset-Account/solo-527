const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

router.get('/', authMiddleware, orderController.getOrders);

router.get('/:id', authMiddleware, orderController.getOrderById);

router.get('/reschedule-records/list', authMiddleware, orderController.getRescheduleRecords);

router.get('/refunds/list', authMiddleware, orderController.getRefunds);

router.post('/', authMiddleware, [
  body('customerName').notEmpty().withMessage('客户姓名不能为空'),
  body('customerPhone').notEmpty().withMessage('客户电话不能为空'),
  body('customerAddress').notEmpty().withMessage('客户地址不能为空'),
  body('applianceType').notEmpty().withMessage('家电类型不能为空'),
  body('faultDescription').notEmpty().withMessage('故障描述不能为空'),
  body('appointmentTime').notEmpty().withMessage('预约时间不能为空'),
  validateRequest
], orderController.createOrder);

router.put('/:id', authMiddleware, orderController.updateOrder);

router.post('/:id/assign', authMiddleware, requireRole('super_admin', 'store_manager', 'customer_service'), [
  body('technicianId').notEmpty().withMessage('师傅ID不能为空'),
  validateRequest
], orderController.assignTechnician);

router.put('/:id/status', authMiddleware, [
  body('status').notEmpty().withMessage('状态不能为空'),
  validateRequest
], orderController.updateOrderStatus);

router.post('/:id/reschedule', authMiddleware, [
  body('newTime').notEmpty().withMessage('新预约时间不能为空'),
  body('reason').notEmpty().withMessage('改约原因不能为空'),
  validateRequest
], orderController.rescheduleOrder);

router.post('/:id/refund', authMiddleware, [
  body('refundType').notEmpty().withMessage('退款类型不能为空'),
  body('refundReason').notEmpty().withMessage('退款原因不能为空'),
  body('refundAmount').isNumeric().withMessage('退款金额必须是数字').toFloat(),
  validateRequest
], orderController.createRefund);

router.put('/refunds/:refundId', authMiddleware, requireRole('super_admin', 'store_manager'), [
  body('status').notEmpty().withMessage('处理状态不能为空'),
  validateRequest
], orderController.processRefund);

router.post('/:id/parts', authMiddleware, [
  body('parts').isArray().withMessage('配件列表必须是数组'),
  validateRequest
], orderController.addOrderParts);

module.exports = router;
