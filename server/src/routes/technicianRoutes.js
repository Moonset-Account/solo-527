const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const technicianController = require('../controllers/technicianController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

router.get('/', authMiddleware, technicianController.getTechnicians);

router.get('/available', authMiddleware, technicianController.getAvailableTechnicians);

router.get('/:id', authMiddleware, technicianController.getTechnicianById);

router.post('/', authMiddleware, requireRole('super_admin', 'store_manager'), [
  body('name').notEmpty().withMessage('师傅姓名不能为空'),
  body('phone').notEmpty().withMessage('手机号不能为空'),
  validateRequest
], technicianController.createTechnician);

router.put('/:id', authMiddleware, requireRole('super_admin', 'store_manager'), [
  body('name').optional().notEmpty().withMessage('师傅姓名不能为空'),
  validateRequest
], technicianController.updateTechnician);

router.delete('/:id', authMiddleware, requireRole('super_admin'), technicianController.deleteTechnician);

module.exports = router;
