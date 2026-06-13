import Redis from 'ioredis'

let redis: Redis | undefined

export function useRedis() {
  if (!redis) {
    const config = useRuntimeConfig()
    redis = new Redis(config.redisUrl)
  }
  return redis
}
