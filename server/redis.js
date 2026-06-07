import Redis from 'ioredis'
import { createHash } from 'crypto'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const ENABLE_FALLBACK = process.env.REDIS_FALLBACK !== 'false'

let redisClient = null
let fallbackCache = new Map()
let useFallback = false

function hashKey(obj) {
  const keys = Object.keys(obj).sort()
  const str = keys.map(k => `${k}=${JSON.stringify(obj[k])}`).join('&')
  return createHash('md5').update(str).digest('hex')
}

async function connectRedis() {
  try {
    redisClient = new Redis(REDIS_URL, {
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      retryDelayOnFailover: 100,
    })

    redisClient.on('error', (err) => {
      console.warn('[Redis] Connection error:', err.message)
      if (ENABLE_FALLBACK && !useFallback) {
        console.warn('[Redis] Falling back to in-memory cache')
        useFallback = true
      }
    })

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully')
      useFallback = false
    })

    await redisClient.ping()
    return true
  } catch (err) {
    console.warn('[Redis] Failed to connect, using fallback:', err.message)
    if (ENABLE_FALLBACK) {
      useFallback = true
    }
    return false
  }
}

async function cacheGet(prefix, params) {
  const key = `${prefix}:${hashKey(params)}`

  if (useFallback || !redisClient) {
    const entry = fallbackCache.get(key)
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data
    }
    if (entry) fallbackCache.delete(key)
    return null
  }

  try {
    const data = await redisClient.get(key)
    return data ? JSON.parse(data) : null
  } catch (err) {
    console.warn('[Redis] Get error:', err.message)
    return null
  }
}

async function cacheSet(prefix, params, data, ttlMs) {
  const key = `${prefix}:${hashKey(params)}`
  const ttlSeconds = Math.ceil(ttlMs / 1000)

  if (useFallback || !redisClient) {
    fallbackCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs })
    if (fallbackCache.size > 1000) {
      const oldKeys = Array.from(fallbackCache.keys()).slice(0, 200)
      oldKeys.forEach(k => fallbackCache.delete(k))
    }
    return
  }

  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds)
  } catch (err) {
    console.warn('[Redis] Set error:', err.message)
  }
}

async function cacheDel(pattern) {
  if (useFallback || !redisClient) {
    for (const key of fallbackCache.keys()) {
      if (key.startsWith(pattern)) {
        fallbackCache.delete(key)
      }
    }
    return
  }

  try {
    const keys = await redisClient.keys(`${pattern}*`)
    if (keys.length > 0) {
      await redisClient.del(keys)
    }
  } catch (err) {
    console.warn('[Redis] Delete error:', err.message)
  }
}

function getCacheStats() {
  return {
    usingFallback: useFallback,
    fallbackSize: fallbackCache.size,
  }
}

export {
  connectRedis,
  cacheGet,
  cacheSet,
  cacheDel,
  getCacheStats,
}
