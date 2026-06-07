import Redis from 'ioredis';

interface MemoryEntry {
  data: unknown;
  expiresAt: number;
}

class RedisCache {
  private client: Redis | null = null;
  private memoryStore = new Map<string, MemoryEntry>();
  private connected = false;

  constructor() {
    try {
      this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });

      this.client.on('error', () => {
        if (this.connected) {
          console.warn('Redis connection lost, falling back to in-memory cache');
        }
        this.connected = false;
        this.client = null;
      });

      this.client.on('connect', () => {
        this.connected = true;
      });

      this.client.connect().catch(() => {
        console.warn('Redis unavailable, using in-memory cache fallback');
        this.connected = false;
        this.client = null;
      });
    } catch {
      console.warn('Redis unavailable, using in-memory cache fallback');
      this.connected = false;
      this.client = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.client && this.connected) {
      try {
        const raw = await this.client.get(key);
        if (raw === null) return null;
        return JSON.parse(raw) as T;
      } catch {
        return this.getFromMemory<T>(key);
      }
    }
    return this.getFromMemory<T>(key);
  }

  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    if (this.client && this.connected) {
      try {
        const serialized = JSON.stringify(data);
        if (ttlMs) {
          await this.client.set(key, serialized, 'PX', ttlMs);
        } else {
          await this.client.set(key, serialized);
        }
        return;
      } catch {
        this.setToMemory(key, data, ttlMs);
        return;
      }
    }
    this.setToMemory(key, data, ttlMs);
  }

  async del(key: string): Promise<void> {
    if (this.client && this.connected) {
      try {
        await this.client.del(key);
        return;
      } catch {
        this.memoryStore.delete(key);
        return;
      }
    }
    this.memoryStore.delete(key);
  }

  async invalidate(pattern: string): Promise<void> {
    if (this.client && this.connected) {
      try {
        const keys = await this.client.keys(`${pattern}*`);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
        return;
      } catch {
        this.invalidateMemory(pattern);
        return;
      }
    }
    this.invalidateMemory(pattern);
  }

  async clear(): Promise<void> {
    if (this.client && this.connected) {
      try {
        await this.client.flushdb();
        return;
      } catch {
        this.memoryStore.clear();
        return;
      }
    }
    this.memoryStore.clear();
  }

  isConnected(): boolean {
    return this.connected;
  }

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setToMemory<T>(key: string, data: T, ttlMs?: number): void {
    this.memoryStore.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? 300000),
    });
  }

  private invalidateMemory(pattern: string): void {
    const keys = Array.from(this.memoryStore.keys());
    for (const key of keys) {
      if (key.startsWith(pattern)) {
        this.memoryStore.delete(key);
      }
    }
  }
}

export const redisCache = new RedisCache();

export const CACHE_TTL = {
  anomalies: 300000,
  funnel: 600000,
  channel: 900000,
  consultant: 600000,
  followup: 1800000,
  filterOptions: 3600000,
} as const;

export function buildCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join('&');
  return `${prefix}:${sorted || 'all'}`;
}
