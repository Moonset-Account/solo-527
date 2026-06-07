export class LRUCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private maxSize: number
  private ttlMs: number

  constructor(maxSize = 200, ttlMs = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttlMs = ttlMs
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > this.ttlMs) { this.cache.delete(key); return null }
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.data
  }

  set(key: string, data: T): void {
    if (this.cache.has(key)) this.cache.delete(key)
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) this.cache.delete(firstKey)
    }
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear(): void { this.cache.clear() }
  get size(): number { return this.cache.size }
}

export function buildCacheKey(prefix: string, filter: Record<string, unknown>): string {
  const sorted = Object.entries(filter)
    .filter(([, v]) => Array.isArray(v) ? (v as unknown[]).length > 0 : v !== undefined && v !== null && v !== false)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${Array.isArray(v) ? (v as unknown[]).sort().join(',') : v}`)
    .join('&')
  return `${prefix}:${sorted}`
}
