interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const MAX_ENTRIES = 100;
const DEFAULT_TTL = 5 * 60 * 1000;

class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private defaultTtl: number;

  constructor(maxSize: number = MAX_ENTRIES, defaultTtl: number = DEFAULT_TTL) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  get(key: string): unknown | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: unknown, ttl?: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? this.defaultTtl),
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.cache.clear();
  }
}

export function generateCacheKey(endpoint: string, params: object): string {
  const sorted = JSON.stringify(params, Object.keys(params).sort());
  return `${endpoint}:${sorted}`;
}

export const cache = new LRUCache();
