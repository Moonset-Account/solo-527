import { LRUCache } from 'lru-cache';

interface CacheOptions {
  max?: number;
  ttl?: number;
}

export class CacheService {
  private caches: Map<string, LRUCache<string, any>> = new Map();

  getCache(namespace: string, options: CacheOptions = {}): LRUCache<string, any> {
    if (!this.caches.has(namespace)) {
      const cache = new LRUCache<string, any>({
        max: options.max || 500,
        ttl: options.ttl || 5 * 60 * 1000,
      });
      this.caches.set(namespace, cache);
    }
    return this.caches.get(namespace)!;
  }

  generateKey(prefix: string, params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .map(k => `${k}=${JSON.stringify(params[k])}`)
      .join('&');
    return `${prefix}:${Buffer.from(sorted).toString('base64').slice(0, 16)}`;
  }

  async getOrSet<T>(
    namespace: string,
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cache = this.getCache(namespace, { ttl });
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached as T;
    }
    const value = await fetcher();
    cache.set(key, value, { ttl });
    return value;
  }

  invalidate(namespace: string, pattern?: string) {
    const cache = this.caches.get(namespace);
    if (!cache) return;
    if (!pattern) {
      cache.clear();
      return;
    }
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  }

  invalidateAll() {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }
}

export const cacheService = new CacheService();

export const CACHE_TTL = {
  OVERVIEW: 5 * 60 * 1000,
  HEATMAP: 10 * 60 * 1000,
  RANK: 10 * 60 * 1000,
  EXCEPTIONS: 1 * 60 * 1000,
  TREND: 5 * 60 * 1000,
  EXPORT: 24 * 60 * 60 * 1000,
};
