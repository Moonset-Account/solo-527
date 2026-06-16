import redis from '@adonisjs/redis/services/main'

export default class CacheService {
  private static defaultTTL = 300

  static async get(key: string) {
    try {
      const data = await redis.get(key)
      if (!data) return null
      try {
        return JSON.parse(data)
      } catch {
        return data
      }
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  static async set(key: string, value: any, ttl: number = CacheService.defaultTTL) {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value)
      if (ttl > 0) {
        await redis.setex(key, ttl, data)
      } else {
        await redis.set(key, data)
      }
      return true
    } catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  }

  static async del(key: string) {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Redis del error:', error)
      return false
    }
  }

  static async delPattern(pattern: string) {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Redis delPattern error:', error)
      return false
    }
  }

  static async exists(key: string) {
    try {
      const result = await redis.exists(key)
      return result > 0
    } catch (error) {
      console.error('Redis exists error:', error)
      return false
    }
  }

  static async incr(key: string, amount = 1) {
    try {
      return await redis.incrby(key, amount)
    } catch (error) {
      console.error('Redis incr error:', error)
      return null
    }
  }

  static remember(key: string, ttl: number, callback: () => Promise<any>) {
    return new Promise(async (resolve, reject) => {
      try {
        const cached = await this.get(key)
        if (cached !== null) {
          resolve(cached)
          return
        }

        const data = await callback()
        await this.set(key, data, ttl)
        resolve(data)
      } catch (error) {
        reject(error)
      }
    })
  }

  static buildKey(prefix: string, ...parts: string[]) {
    return `${prefix}:${parts.join(':')}`
  }
}

export const CacheKeys = {
  DASHBOARD_STATS: 'dashboard:stats',
  DASHBOARD_TODOS: (userId: number | string) => `dashboard:todos:${userId}`,
  SEAT_DETAIL: (seatId: number | string) => `seat:detail:${seatId}`,
  USAGE_TRENDS: (seatId?: number | string) => seatId ? `usage:trends:${seatId}` : 'usage:trends:all',
  PLANS_LIST: 'plans:list',
  BILLING_CYCLES: 'billing:cycles',
  USER_PERMISSIONS: (userId: number | string) => `user:permissions:${userId}`,
  USER_ROLES: (userId: number | string) => `user:roles:${userId}`,
}
