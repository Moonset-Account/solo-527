interface CacheEntry<T> {
  data: T
  timestamp: number
}

const MAX_SIZE = 100
const TTL_MS = 5 * 60 * 1000

const cache = new Map<string, CacheEntry<unknown>>()

function hashKey(params: Record<string, unknown>): string {
  return JSON.stringify(params)
}

export function getCache<T>(params: Record<string, unknown>): T | null {
  const key = hashKey(params)
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache<T>(params: Record<string, unknown>, data: T): void {
  const key = hashKey(params)
  if (cache.size >= MAX_SIZE) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
  cache.set(key, { data, timestamp: Date.now() })
}

export function clearCache(): void {
  cache.clear()
}

export function getCacheStats(): { size: number; maxSize: number; ttlMs: number } {
  return { size: cache.size, maxSize: MAX_SIZE, ttlMs: TTL_MS }
}
