import Redis from '@ioc:Adonis/Addons/Redis'

export default class CacheService {
  public static async get(key: string) {
    try {
      const value = await Redis.get(key)
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  }

  public static async set(key: string, value: any, ttlMinutes: number = 60) {
    try {
      await Redis.setex(key, ttlMinutes * 60, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }

  public static async delete(key: string) {
    try {
      await Redis.del(key)
      return true
    } catch {
      return false
    }
  }

  public static async invalidatePattern(pattern: string) {
    try {
      const keys = await Redis.keys(pattern)
      if (keys.length > 0) {
        await Redis.del(...keys)
      }
      return true
    } catch {
      return false
    }
  }
}
