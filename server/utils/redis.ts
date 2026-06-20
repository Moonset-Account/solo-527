import Redis from 'ioredis'
import type { Redis as RedisType } from 'ioredis'

let redis: RedisType | null = null

export const useRedis = () => {
  if (!redis) {
    const config = useRuntimeConfig()
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryDelayOnFailover: 100
    })

    redis.on('error', (err) => {
      console.error('Redis connection error:', err)
    })

    redis.on('connect', () => {
      console.log('Redis connected successfully')
    })
  }
  return redis
}

export const cacheSet = async (key: string, value: any, ttl: number = 3600) => {
  const redis = useRedis()
  await redis.setex(key, ttl, JSON.stringify(value))
}

export const cacheGet = async <T = any>(key: string): Promise<T | null> => {
  const redis = useRedis()
  const value = await redis.get(key)
  return value ? JSON.parse(value) : null
}

export const cacheDel = async (key: string) => {
  const redis = useRedis()
  await redis.del(key)
}
