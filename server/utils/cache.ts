import Redis from 'ioredis'

let redis: Redis | null = null

export const getRedis = (): Redis => {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false
    })
  }
  return redis
}

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const redis = getRedis()
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export const cacheSet = async (key: string, value: any, ttlSeconds = 300): Promise<void> => {
  try {
    const redis = getRedis()
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    // Redis unavailable, skip caching
  }
}

export const cacheDel = async (key: string): Promise<void> => {
  try {
    const redis = getRedis()
    await redis.del(key)
  } catch {
    // Redis unavailable, skip
  }
}
