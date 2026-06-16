import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis =
  globalForRedis.redis ??
  new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    retryDelayOnFailover: 100,
    retryDelay: (times) => Math.min(times * 50, 2000),
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

redis.on('error', (error) => {
  console.error('Redis connection error:', error)
})

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttl = 300): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl)
  } catch {
    console.warn('Redis cache set failed for key:', key)
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch {
    console.warn('Redis cache delete failed for key:', key)
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    console.warn('Redis cache pattern delete failed for pattern:', pattern)
  }
}
