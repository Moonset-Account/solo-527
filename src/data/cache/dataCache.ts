interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  accessCount: number
}

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>
  private maxSize: number
  private ttl: number

  constructor(maxSize: number = 20, ttl: number = 1000 * 60 * 30) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  private hashKey(obj: unknown): string {
    return JSON.stringify(obj)
  }

  get(key: unknown): T | undefined {
    const hashKey = this.hashKey(key)
    const entry = this.cache.get(hashKey)
    
    if (!entry) return undefined
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(hashKey)
      return undefined
    }
    
    entry.accessCount++
    this.cache.delete(hashKey)
    this.cache.set(hashKey, entry)
    
    return entry.value
  }

  set(key: unknown, value: T): void {
    const hashKey = this.hashKey(key)
    
    if (this.cache.has(hashKey)) {
      this.cache.delete(hashKey)
    }
    
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
    
    this.cache.set(hashKey, {
      key: hashKey,
      value,
      timestamp: Date.now(),
      accessCount: 0,
    })
  }

  has(key: unknown): boolean {
    const hashKey = this.hashKey(key)
    const entry = this.cache.get(hashKey)
    if (!entry) return false
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(hashKey)
      return false
    }
    return true
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: unknown): void {
    const hashKey = this.hashKey(key)
    this.cache.delete(hashKey)
  }

  size(): number {
    return this.cache.size
  }
}

export const dataCache = new LRUCache(30)
export const chartCache = new LRUCache(50)
