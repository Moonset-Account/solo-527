/**
 * 模拟 Redis 缓存层
 * 
 * 实现多级缓存策略：
 * 1. L1: 内存 Map 缓存（热数据，访问最快）
 * 2. L2: localStorage 持久化缓存（会话级，刷新不丢失）
 * 
 * 支持功能：
 * - TTL 自动过期
 * - 按前缀查询
 * - 缓存统计
 * - 原子操作
 */

const STORAGE_PREFIX = 'aq_cache:'
const MEMORY_MAX_ENTRIES = 500

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheStats {
  hits: number
  misses: number
  memoryKeys: number
  storageKeys: number
}

class MockRedis {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private stats: CacheStats = { hits: 0, misses: 0, memoryKeys: 0, storageKeys: 0 }
  private lruKeys: string[] = []

  constructor() {
    this.restoreFromStorage()
    this.startCleanupInterval()
  }

  private getStorageKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`
  }

  private restoreFromStorage(): void {
    try {
      const now = Date.now()
      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i)
        if (!fullKey || !fullKey.startsWith(STORAGE_PREFIX)) continue

        try {
          const raw = localStorage.getItem(fullKey)
          if (!raw) continue

          const entry: CacheEntry<any> = JSON.parse(raw)
          if (now - entry.timestamp > entry.ttl) {
            localStorage.removeItem(fullKey)
          } else {
            const key = fullKey.replace(STORAGE_PREFIX, '')
            this.memoryCache.set(key, entry)
            this.touchLru(key)
          }
        } catch {
          localStorage.removeItem(fullKey)
        }
      }
      this.updateStats()
    } catch {
      console.warn('[Redis] Failed to restore from localStorage')
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired()
      this.evictIfNeeded()
    }, 60000)
  }

  private cleanupExpired(): void {
    const now = Date.now()
    let expiredCount = 0

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key)
        this.removeFromLru(key)
        try {
          localStorage.removeItem(this.getStorageKey(key))
        } catch { /* ignore */ }
        expiredCount++
      }
    }

    if (expiredCount > 0) {
      console.debug(`[Redis] Cleaned ${expiredCount} expired keys`)
    }
    this.updateStats()
  }

  private evictIfNeeded(): void {
    while (this.memoryCache.size > MEMORY_MAX_ENTRIES) {
      const oldestKey = this.lruKeys.shift()
      if (oldestKey) {
        this.memoryCache.delete(oldestKey)
      }
    }
  }

  private touchLru(key: string): void {
    this.removeFromLru(key)
    this.lruKeys.push(key)
  }

  private removeFromLru(key: string): void {
    const idx = this.lruKeys.indexOf(key)
    if (idx >= 0) {
      this.lruKeys.splice(idx, 1)
    }
  }

  private updateStats(): void {
    this.stats.memoryKeys = this.memoryCache.size
    let storageCount = 0
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(STORAGE_PREFIX)) storageCount++
      }
    } catch { /* ignore */ }
    this.stats.storageKeys = storageCount
  }

  get<T>(key: string): T | null {
    const now = Date.now()
    const entry = this.memoryCache.get(key)

    if (entry) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key)
        this.removeFromLru(key)
        try {
          localStorage.removeItem(this.getStorageKey(key))
        } catch { /* ignore */ }
        this.stats.misses++
        return null
      }
      this.touchLru(key)
      this.stats.hits++
      return entry.data as T
    }

    try {
      const raw = localStorage.getItem(this.getStorageKey(key))
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw)
        if (now - parsed.timestamp <= parsed.ttl) {
          this.memoryCache.set(key, parsed)
          this.touchLru(key)
          this.stats.hits++
          return parsed.data
        } else {
          localStorage.removeItem(this.getStorageKey(key))
        }
      }
    } catch { /* ignore */ }

    this.stats.misses++
    return null
  }

  set<T>(key: string, data: T, ttlMs: number, persist: boolean = true): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    }

    this.memoryCache.set(key, entry)
    this.touchLru(key)
    this.evictIfNeeded()

    if (persist && ttlMs > 60000) {
      try {
        localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry))
      } catch (e) {
        console.warn('[Redis] localStorage full, skipping persist for', key)
      }
    }

    this.updateStats()
  }

  del(key: string): void {
    this.memoryCache.delete(key)
    this.removeFromLru(key)
    try {
      localStorage.removeItem(this.getStorageKey(key))
    } catch { /* ignore */ }
    this.updateStats()
  }

  delByPrefix(prefix: string): number {
    let count = 0
    for (const key of Array.from(this.memoryCache.keys())) {
      if (key.startsWith(prefix)) {
        this.del(key)
        count++
      }
    }
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i)
        if (fullKey?.startsWith(this.getStorageKey(prefix))) {
          keysToRemove.push(fullKey)
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k))
    } catch { /* ignore */ }
    return count
  }

  exists(key: string): boolean {
    return this.get(key) !== null
  }

  keys(prefix?: string): string[] {
    const allKeys = Array.from(this.memoryCache.keys())
    if (!prefix) return allKeys
    return allKeys.filter(k => k.startsWith(prefix))
  }

  getStats(): CacheStats {
    this.updateStats()
    return { ...this.stats }
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses
    if (total === 0) return 0
    return this.stats.hits / total
  }

  flushAll(): void {
    this.memoryCache.clear()
    this.lruKeys = []
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k))
    } catch { /* ignore */ }
    this.stats = { hits: 0, misses: 0, memoryKeys: 0, storageKeys: 0 }
    console.log('[Redis] All cache flushed')
  }

  async withCache<T>(
    key: string,
    ttlMs: number,
    fetcher: () => Promise<T>,
    persist: boolean = true
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttlMs, persist)
    return data
  }
}

export const redis = new MockRedis()

export const TTL = {
  REAL_TIME: 30 * 1000,
  SHORT: 5 * 60 * 1000,
  MEDIUM: 30 * 60 * 1000,
  LONG: 4 * 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000,
} as const

export default redis
