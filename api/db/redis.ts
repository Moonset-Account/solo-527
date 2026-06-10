import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000)
    return delay
  },
})

redis.on('connect', () => {
  console.log('Redis connected')
})

redis.on('error', (error) => {
  console.warn('Redis connection warning:', error.message)
})

redis.on('close', () => {
  console.warn('Redis connection closed')
})

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.ping()
    console.log('Redis ping successful')
  } catch (error) {
    console.warn('Redis unavailable, running without cache:', (error as Error).message)
  }
}
