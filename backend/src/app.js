const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const purchaseRequestRoutes = require('./routes/purchaseRequest')
const approvalRoutes = require('./routes/approval')
const priceRoutes = require('./routes/price')
const trackingRoutes = require('./routes/tracking')
const paymentRoutes = require('./routes/payment')
const batchRoutes = require('./routes/batch')
const supplierRoutes = require('./routes/supplier')

const app = express()
const PORT = process.env.PORT || 3001

const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(uploadDir))

app.use('/api/auth', authRoutes)
app.use('/api/purchase-requests', purchaseRequestRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/price', priceRoutes)
app.use('/api/tracking', trackingRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/batch', batchRoutes)
app.use('/api/suppliers', supplierRoutes)

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
