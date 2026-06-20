import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

import sequelize from '../config/database.js'
import redis from '../config/redis.js'
import '../app/Models/index.js'

import routes from './routes_express.js'

const app = express()
const PORT = process.env.PORT || 3333

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.use(routes)

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err)
  res.status(500).json({
    code: 1,
    message: '服务器内部错误',
  })
})

app.use((req, res) => {
  res.status(404).json({
    code: 1,
    message: '接口不存在',
  })
})

const startServer = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connection established successfully')

    await redis.ping()
    console.log('✅ Redis connection established successfully')

    app.listen(PORT, () => {
      console.log('')
      console.log('🚀 Server running on port ' + PORT)
      console.log('📡 Health check: http://localhost:' + PORT + '/health')
      console.log('🔐 Login:         POST http://localhost:' + PORT + '/api/auth/login')
      console.log('')
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

startServer()

export default app
