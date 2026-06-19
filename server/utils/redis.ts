import Redis from 'ioredis'

const config = useRuntimeConfig()

let redisInstance: Redis | null = null

export const getRedis = () => {
  if (!redisInstance) {
    redisInstance = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    })
  }
  return redisInstance
}

export const redis = {
  get: async (key: string) => {
    try {
      const client = getRedis()
      return await client.get(key)
    } catch {
      return null
    }
  },
  set: async (key: string, value: string, ttl?: number) => {
    try {
      const client = getRedis()
      if (ttl) {
        await client.set(key, value, 'EX', ttl)
      } else {
        await client.set(key, value)
      }
      return true
    } catch {
      return false
    }
  },
  del: async (key: string) => {
    try {
      const client = getRedis()
      await client.del(key)
      return true
    } catch {
      return false
    }
  },
}
