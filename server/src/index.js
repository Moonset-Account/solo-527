const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Photography Pipeline API is running' })
})

const brandRoutes = require('./routes/brands')
const orderRoutes = require('./routes/orders')
const scheduleRoutes = require('./routes/schedules')
const deliveryNodeRoutes = require('./routes/deliveryNodes')
const brandQuoteRoutes = require('./routes/brandQuotes')
const contractRoutes = require('./routes/contracts')
const paymentRoutes = require('./routes/payments')
const workAuthRoutes = require('./routes/workAuthorizations')
const selectedPhotoRoutes = require('./routes/selectedPhotos')
const finalPhotoRoutes = require('./routes/finalPhotos')
const memberRoutes = require('./routes/members')
const subscriptionRoutes = require('./routes/subscriptions')
const sponsorshipRoutes = require('./routes/sponsorships')
const exceptionPoolRoutes = require('./routes/exceptionPools')
const syncLogRoutes = require('./routes/syncLogs')
const statsRoutes = require('./routes/stats')

app.use('/api/brands', brandRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/delivery-nodes', deliveryNodeRoutes)
app.use('/api/brand-quotes', brandQuoteRoutes)
app.use('/api/contracts', contractRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/work-authorizations', workAuthRoutes)
app.use('/api/selected-photos', selectedPhotoRoutes)
app.use('/api/final-photos', finalPhotoRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/sponsorships', sponsorshipRoutes)
app.use('/api/exception-pools', exceptionPoolRoutes)
app.use('/api/sync-logs', syncLogRoutes)
app.use('/api/stats', statsRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    suggestion: getErrorSuggestion(err)
  })
})

function getErrorSuggestion(err) {
  if (err.code === 'P2002') {
    return '数据唯一约束冲突，请检查重复字段后重试'
  }
  if (err.code === 'P2025') {
    return '记录不存在，请刷新列表后重试'
  }
  if (err.code === 'P2003') {
    return '外键约束失败，请检查关联数据是否存在'
  }
  if (err.name === 'ValidationError') {
    return '数据验证失败，请检查输入格式'
  }
  return '请检查输入数据或联系技术支持'
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

module.exports = { prisma, app }
