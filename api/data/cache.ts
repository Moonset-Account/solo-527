interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class QueryCache {
  private static instance: QueryCache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 60 * 1000;

  private constructor() {
    setInterval(() => this.cleanup(), 30 * 1000);
  }

  public static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache();
    }
    return QueryCache.instance;
  }

  private generateKey(prefix: string, params: any): string {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  public get<T>(prefix: string, params: any): T | null {
    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  public set<T>(prefix: string, params: any, value: T, ttl?: number): void {
    const key = this.generateKey(prefix, params);
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  public invalidate(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  public getStats(): { keys: number; size: number } {
    return {
      keys: this.cache.size,
      size: JSON.stringify([...this.cache.entries()]).length
    };
  }
}

export const queryCache = QueryCache.getInstance();
