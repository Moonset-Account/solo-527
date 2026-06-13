const express = require('express')
const router = express.Router()
const {
  getPriceTrend,
  getDeliveryConfirmations,
  confirmDelivery,
  getOriginalDocuments,
  getPurchaseRequests,
} = require('../controllers/trackingController')
const { authMiddleware } = require('../middleware/auth')

router.get('/price-trend', authMiddleware, getPriceTrend)
router.get('/delivery-confirmations', authMiddleware, getDeliveryConfirmations)
router.post('/delivery-confirmations', authMiddleware, confirmDelivery)
router.get('/original-documents', authMiddleware, getOriginalDocuments)
router.get('/purchase-requests', authMiddleware, getPurchaseRequests)

module.exports = router
