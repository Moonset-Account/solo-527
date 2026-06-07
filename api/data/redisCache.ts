import Redis from 'ioredis';

interface MemoryEntry {
  data: unknown;
  expiresAt: number;
}

class RedisCache {
  private client: Redis | null = null;
  private memoryStore = new Map<string, MemoryEntry>();
  private _connected = false;
  private connectPromise: Promise<void> | null = null;

  constructor() {
    this.connectPromise = this.init();
  }

  private async init(): Promise<void> {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 5) return null;
          return Math.min(times * 200, 2000);
        },
        connectTimeout: 5000,
        commandTimeout: 3000,
      });

      this.client.on('error', (err) => {
        console.warn('Redis error:', err.message);
      });

      this.client.on('ready', () => {
        this._connected = true;
        console.log('Redis cache connected:', url.replace(/\/\/.*@/, '//***@'));
      });

      this.client.on('close', () => {
        this._connected = false;
      });

      this.client.on('reconnecting', () => {
        this._connected = false;
      });

      await this.client.ping();
      this._connected = true;
    } catch {
      console.warn('Redis unavailable at', url, '— using in-memory cache fallback');
      this._connected = false;
      this.client = null;
    }
  }

  async ready(): Promise<void> {
    if (this.connectPromise) {
      await this.connectPromise;
    }
  }

  isConnected(): boolean {
    return this._connected;
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.client && this._connected) {
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
    if (this.client && this._connected) {
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
    if (this.client && this._connected) {
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
    if (this.client && this._connected) {
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
    if (this.client && this._connected) {
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
