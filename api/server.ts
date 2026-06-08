import app from './app.js'
import { startScheduler, stopScheduler } from './scheduler.js'

const PORT = process.env.PORT || 3099

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
  startScheduler()
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  stopScheduler()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  stopScheduler()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
