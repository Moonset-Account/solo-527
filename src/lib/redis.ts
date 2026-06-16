import Redis from 'ioredis'

let redis: Redis | null = null

export const getRedisClient = (): Redis => {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set')
    }
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryDelayOnFailover: 100,
    })

    redis.on('error', (error) => {
      console.error('Redis connection error:', error)
    })

    redis.on('connect', () => {
      console.log('Redis connected successfully')
    })
  }
  return redis
}

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const client = getRedisClient()
    const data = await client.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

export const cacheSet = async (key: string, value: unknown, ttlSeconds = 3600): Promise<void> => {
  try {
    const client = getRedisClient()
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

export const cacheDelete = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient()
    await client.del(key)
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
  try {
    const client = getRedisClient()
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(...keys)
    }
  } catch (error) {
    console.error('Cache delete pattern error:', error)
  }
}
