import Redis from 'ioredis'

let redis: Redis | null = null

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  })

  redis.on('connect', () => {
    console.log('Redis connected')
  })

  redis.on('error', (err) => {
    console.error('Redis connection error:', err.message)
  })
})

export function useRedis() {
  return redis
}
