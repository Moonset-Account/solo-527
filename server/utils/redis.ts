import Redis from 'ioredis'

let redis: Redis | null = null

export function useRedis(): Redis {
  if (!redis) {
    const config = useRuntimeConfig()
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100
    })
    redis.on('error', (err) => {
      console.error('[Redis] Error:', err.message)
    })
  }
  return redis
}
