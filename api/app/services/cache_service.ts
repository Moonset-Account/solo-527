import { Redis } from 'ioredis'
import env from '#start/env'

export class CacheService {
  private static instance: Redis | null = null

  private getConnection(): Redis {
    if (!CacheService.instance) {
      CacheService.instance = new Redis({
        host: env.get('REDIS_HOST', '127.0.0.1'),
        port: env.get('REDIS_PORT', 6379),
        password: env.get('REDIS_PASSWORD', ''),
        db: env.get('REDIS_DB', 0),
        lazyConnect: true,
      })
    }
    return CacheService.instance
  }

  async get(key: string): Promise<any | null> {
    const redis = this.getConnection()
    const value = await redis.get(`cache:${key}`)
    if (!value) return null
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const redis = this.getConnection()
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    await redis.set(`cache:${key}`, serialized, 'EX', ttlSeconds)
  }

  async del(key: string): Promise<void> {
    const redis = this.getConnection()
    await redis.del(`cache:${key}`)
  }

  async delPattern(pattern: string): Promise<void> {
    const redis = this.getConnection()
    const keys = await redis.keys(`cache:${pattern}`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  async invalidate(prefix: string): Promise<void> {
    await this.delPattern(`${prefix}*`)
  }
}
