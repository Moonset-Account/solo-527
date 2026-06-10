import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/orchard-farm'

export const connectMongo = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log(`MongoDB connected: ${mongoose.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error)
})

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected')
})
