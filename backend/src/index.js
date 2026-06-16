import express from 'express'
import cors from 'cors'
import prisma from './prisma.js'
import authRoutes from './routes/auth.js'
import eventRoutes from './routes/events.js'
import orderRoutes from './routes/orders.js'
import checkInRoutes from './routes/checkIns.js'
import refundRoutes from './routes/refunds.js'
import dashboardRoutes from './routes/dashboard.js'
import todoRoutes from './routes/todos.js'
import notificationRoutes from './routes/notifications.js'
import filterRoutes from './routes/filters.js'
import feedbackRoutes from './routes/feedbacks.js'
import revenueRoutes from './routes/revenue.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { status: 'running' } })
})

app.use('/api/auth', authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/checkins', checkInRoutes)
app.use('/api/refunds', refundRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/todos', todoRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/filters', filterRoutes)
app.use('/api/feedbacks', feedbackRoutes)
app.use('/api/revenue', revenueRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ code: 500, message: err.message || '服务器错误' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use, trying ${PORT + 1}...`)
    app.listen(PORT + 1, () => {
      console.log(`Server running on port ${PORT + 1}`)
    })
  } else {
    throw err
  }
})

export default app
