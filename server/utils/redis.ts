import Redis from 'ioredis'

const config = useRuntimeConfig()

const redis = new Redis({
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword || undefined,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3
})

redis.on('connect', () => {
  console.log('Redis connected successfully')
})

redis.on('error', (err) => {
  console.error('Redis connection error:', err)
})

export default redis
