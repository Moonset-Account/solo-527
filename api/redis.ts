import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

let redis: Redis | null = null
let _connected = false

export async function initRedis(): Promise<boolean> {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) return null
        return Math.min(times * 200, 1000)
      },
      lazyConnect: true,
    })

    await redis.connect()
    _connected = true
    console.log('[Redis] connected')
    return true
  } catch (e) {
    console.warn('[Redis] connection failed, using in-process fallback:', (e as Error).message)
    redis = null
    _connected = false
    return false
  }
}

export function isRedisConnected(): boolean {
  return _connected && redis !== null
}

const CACHE_TTL_SECONDS = 300
const KEY_PREFIX = 'budget:'

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null
  try {
    const raw = await redis.get(KEY_PREFIX + key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function cacheSet<T>(key: string, data: T, ttlSeconds = CACHE_TTL_SECONDS): Promise<void> {
  if (!redis) return
  try {
    await redis.set(KEY_PREFIX + key, JSON.stringify(data), 'EX', ttlSeconds)
  } catch {
    // silent fail
  }
}

export async function cacheDelete(pattern: string): Promise<void> {
  if (!redis) return
  try {
    const keys = await redis.keys(KEY_PREFIX + pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // silent fail
  }
}

export async function cacheClear(): Promise<void> {
  if (!redis) return
  try {
    const keys = await redis.keys(KEY_PREFIX + '*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // silent fail
  }
}

export async function setUpdateTimestamp(ts: string): Promise<void> {
  if (!redis) return
  try {
    await redis.set(KEY_PREFIX + 'meta:updated_at', ts)
  } catch {
    // silent fail
  }
}

export async function getUpdateTimestamp(): Promise<string | null> {
  if (!redis) return null
  try {
    return await redis.get(KEY_PREFIX + 'meta:updated_at')
  } catch {
    return null
  }
}

import { LRUCache, buildCacheKey } from './cache.js'

const fallbackCache = new LRUCache<unknown>(200)

export function fallbackCacheGet(key: string): unknown | null {
  return fallbackCache.get(key)
}

export function fallbackCacheSet(key: string, data: unknown): void {
  fallbackCache.set(key, data)
}

export function fallbackCacheClear(): void {
  fallbackCache.clear()
}

export { buildCacheKey }
