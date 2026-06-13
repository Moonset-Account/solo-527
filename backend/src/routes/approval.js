const express = require('express')
const router = express.Router()
const {
  getLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  getMyApprovals,
  approve,
  reject,
} = require('../controllers/approvalController')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')

router.get('/levels', authMiddleware, getLevels)
router.post('/levels', authMiddleware, roleMiddleware(['admin']), createLevel)
router.put('/levels/:id', authMiddleware, roleMiddleware(['admin']), updateLevel)
router.delete('/levels/:id', authMiddleware, roleMiddleware(['admin']), deleteLevel)

router.get('/my', authMiddleware, getMyApprovals)
router.post('/:id/approve', authMiddleware, approve)
router.post('/:id/reject', authMiddleware, reject)

module.exports = router
