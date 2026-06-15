import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 500, 5000)
    return delay
  },
})

redis.on('connect', () => {
  console.log('Redis connected successfully')
})

redis.on('error', (err) => {
  console.error('Redis connection error:', err)
})

redis.on('ready', () => {
  console.log('Redis ready')
})

export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await redis.get(key)
  } catch (error) {
    console.error('Redis cacheGet error:', error)
    return null
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number = 300): Promise<void> {
  try {
    await redis.set(key, value, 'EX', ttlSeconds)
  } catch (error) {
    console.error('Redis cacheSet error:', error)
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Redis cacheDel error:', error)
  }
}
