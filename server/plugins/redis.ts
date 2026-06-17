import Redis from 'ioredis'

let redis: Redis | null = null

export function useRedis(): Redis {
  if (!redis) {
    const config = useRuntimeConfig()
    const redisUrl = config.REDIS_URL || 'redis://localhost:6379'
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true
    })
  }
  return redis
}

export default defineNitroPlugin(() => {
  try {
    useRedis()
  } catch (e) {
    console.warn('Redis connection failed, proceeding without cache')
  }
})
