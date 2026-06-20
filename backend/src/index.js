import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sequelize from './db/index.js'
import './db/models.js'
import routes from './routes/index.js'
import redis from './config/redis.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'running',
      timestamp: new Date().toISOString()
    }
  })
})

app.use('/api', routes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    code: 1,
    message: '服务器内部错误'
  })
})

const startServer = async () => {
  try {
    await sequelize.authenticate()
    console.log('Database connected')

    await sequelize.sync({ alter: false })
    console.log('Database synchronized')

    await redis.ping()
    console.log('Redis connected')

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app
