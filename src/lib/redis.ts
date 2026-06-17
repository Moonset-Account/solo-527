import Redis from 'ioredis'

const redisClientSingleton = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  })
}

declare const globalThis: {
  redisGlobal: ReturnType<typeof redisClientSingleton>
} & typeof global

const redis = globalThis.redisGlobal ?? redisClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.redisGlobal = redis

export default redis
