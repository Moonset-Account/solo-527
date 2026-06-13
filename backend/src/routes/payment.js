const express = require('express')
const router = express.Router()
const {
  getPaymentAlerts,
  createPaymentAlert,
  resolvePaymentAlert,
  getSupplierRiskBoard,
  getSupplierRiskDetail,
} = require('../controllers/paymentController')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')

router.get('/alerts', authMiddleware, roleMiddleware(['procurement_manager', 'admin', 'finance']), getPaymentAlerts)
router.post('/alerts', authMiddleware, roleMiddleware(['finance', 'admin']), createPaymentAlert)
router.post('/alerts/:id/resolve', authMiddleware, roleMiddleware(['procurement_manager', 'admin']), resolvePaymentAlert)

router.get('/risk-board', authMiddleware, roleMiddleware(['procurement_manager', 'admin']), getSupplierRiskBoard)
router.get('/risk-board/:id', authMiddleware, roleMiddleware(['procurement_manager', 'admin']), getSupplierRiskDetail)

module.exports = router
