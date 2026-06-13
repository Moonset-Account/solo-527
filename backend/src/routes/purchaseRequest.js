const express = require('express')
const router = express.Router()
const {
  getList,
  getDetail,
  create,
  update,
  submit,
  uploadAttachment,
  deleteAttachment,
  deleteRequest,
} = require('../controllers/purchaseRequestController')
const { authMiddleware } = require('../middleware/auth')
const upload = require('../middleware/upload')

router.get('/', authMiddleware, getList)
router.get('/:id', authMiddleware, getDetail)
router.post('/', authMiddleware, create)
router.put('/:id', authMiddleware, update)
router.post('/:id/submit', authMiddleware, submit)
router.post('/attachments', authMiddleware, upload.single('file'), uploadAttachment)
router.delete('/attachments/:id', authMiddleware, deleteAttachment)
router.delete('/:id', authMiddleware, deleteRequest)

module.exports = router
