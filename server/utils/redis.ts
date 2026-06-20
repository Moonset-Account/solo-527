import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis }

export const useRedis = () => {
  if (globalForRedis.redis) return globalForRedis.redis
  const config = useRuntimeConfig()
  const options: Redis.RedisOptions = {
    host: config.redisHost,
    port: config.redisPort,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false
  }
  if (config.redisPassword) options.password = config.redisPassword
  globalForRedis.redis = new Redis(options)
  return globalForRedis.redis
}
