const express = require('express')
const router = express.Router()
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')

router.get('/', authMiddleware, getSuppliers)
router.get('/:id', authMiddleware, getSupplier)
router.post('/', authMiddleware, roleMiddleware(['admin', 'procurement_manager']), createSupplier)
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'procurement_manager']), updateSupplier)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteSupplier)

module.exports = router
