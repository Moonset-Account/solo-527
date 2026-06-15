import app from './app.js'
import { connectDB } from './db/mongodb.js'
import { redis } from './db/redis.js'

const PORT = process.env.PORT || 3001

async function startServer() {
  try {
    await connectDB()
    console.log('Database connected')

    await redis.ping()
    console.log('Redis connected')
  } catch (error) {
    console.error('Failed to connect to database or Redis:', error)
    console.log('Starting server anyway without DB connections...')
  }

  const server = app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`)
  })

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('SIGINT signal received')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
}

startServer()

export default app
