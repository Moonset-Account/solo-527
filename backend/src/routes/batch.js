const express = require('express')
const router = express.Router()
const {
  getBatchLogs,
  getBatchDetail,
  previewUpdate,
  batchUpdate,
} = require('../controllers/batchController')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')

router.get('/logs', authMiddleware, getBatchLogs)
router.get('/logs/:id', authMiddleware, getBatchDetail)
router.post('/preview', authMiddleware, previewUpdate)
router.post('/update', authMiddleware, batchUpdate)

module.exports = router
