import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis }

const config = useRuntimeConfig()

export const redis = globalForRedis.redis || new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 50, 2000)
  }
})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message)
})

export default redis
