import type { CacheEntry } from '@/types'

const cache = new Map<string, CacheEntry<unknown>>()
const DEFAULT_TTL = 5 * 60 * 1000
let lastUpdateTime = Date.now()

function hashFilter(filter: Record<string, unknown>): string {
  return JSON.stringify(filter)
}

export function getCache<T>(key: string, filter: Record<string, unknown>): CacheEntry<T> | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key)
    return null
  }
  if (entry.filterHash !== hashFilter(filter)) return null
  return entry as CacheEntry<T>
}

export function setCache<T>(key: string, data: T, filter: Record<string, unknown>, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    filterHash: hashFilter(filter),
    ttl,
  })
  lastUpdateTime = Date.now()
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
  } else {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) cache.delete(key)
    }
  }
  lastUpdateTime = Date.now()
}

export function getLastUpdateTime(): string {
  return new Date(lastUpdateTime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
