import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-scheduling'

const MAX_RETRIES = 5
const RETRY_DELAY = 3000

let retryCount = 0

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI)
    retryCount = 0
    console.log('MongoDB connected successfully')
  } catch (error) {
    retryCount++
    console.error(`MongoDB connection failed (attempt ${retryCount}/${MAX_RETRIES}):`, error)

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`)
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
      return connectDB()
    } else {
      console.error('Max MongoDB connection retries reached. Exiting.')
      process.exit(1)
    }
  }
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected')
})

export { mongoose }
