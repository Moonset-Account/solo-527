import Redis from 'ioredis'

let redis: Redis

declare module 'nitropack' {
  interface NitroApp {
    redis: Redis
  }
}

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()

  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
    })

    redis.on('error', (err) => {
      console.error('[Redis] 连接错误:', err.message)
    })

    redis.on('connect', () => {
      console.log('[Redis] 连接成功')
    })
  }

  nitroApp.redis = redis
})

export function useRedis(): Redis {
  if (!redis) {
    const config = useRuntimeConfig()
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
    })
  }
  return redis
}
