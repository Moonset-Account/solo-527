const express = require('express')
const router = express.Router()
const {
  getHistory,
  addPriceHistory,
  getAlerts,
  reviewAlert,
  getReviews,
} = require('../controllers/priceController')
const { authMiddleware } = require('../middleware/auth')

router.get('/history', authMiddleware, getHistory)
router.post('/history', authMiddleware, addPriceHistory)
router.get('/alerts', authMiddleware, getAlerts)
router.post('/alerts/:id/review', authMiddleware, reviewAlert)
router.get('/reviews', authMiddleware, getReviews)

module.exports = router
