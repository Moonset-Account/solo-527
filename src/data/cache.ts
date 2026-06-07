import type { CacheEntry } from '@/types'

export const STATION_TTL = 1800000
export const AGGREGATE_TTL = 900000
export const REPORT_TTL = 86400000
export const FILTER_TTL = Infinity

export const memoryCache = new Map<string, CacheEntry<unknown>>()

export function isCacheValid(entry: CacheEntry<unknown>): boolean {
  if (!isFinite(entry.ttl)) return true
  return entry.timestamp + entry.ttl > Date.now()
}

export function getCache<T>(key: string): T | null {
  const memEntry = memoryCache.get(key)
  if (memEntry) {
    if (isCacheValid(memEntry)) {
      return memEntry.data as T
    }
    memoryCache.delete(key)
  }

  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const entry: CacheEntry<unknown> = JSON.parse(raw)
      if (entry.ttl == null || !isFinite(entry.ttl) || isCacheValid(entry)) {
        memoryCache.set(key, entry)
        return entry.data as T
      }
      localStorage.removeItem(key)
    }
  } catch {
    return null
  }

  return null
}

export function setCache<T>(
  key: string,
  data: T,
  ttl: number,
  persist?: boolean,
): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl }
  memoryCache.set(key, entry as CacheEntry<unknown>)
  if (persist) {
    try {
      localStorage.setItem(key, JSON.stringify(entry))
    } catch {
      return
    }
  }
}

export function clearCache(key?: string): void {
  if (key) {
    memoryCache.delete(key)
    try {
      localStorage.removeItem(key)
    } catch {
      return
    }
  } else {
    memoryCache.clear()
    try {
      localStorage.clear()
    } catch {
      return
    }
  }
}
