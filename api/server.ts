import app from './app.js'
import { connectMongo } from './db/mongodb.js'
import { connectRedis } from './db/redis.js'

const PORT = process.env.PORT || 3001

const startServer = async () => {
  await connectMongo()
  await connectRedis()

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