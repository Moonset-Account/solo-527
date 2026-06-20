import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis =
  globalForRedis.redis ??
  new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
    showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Silently fail for cache operations
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // Silently fail for cache operations
  }
}

export async function cacheDelByPattern(pattern: string): Promise<void> {
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    return new Promise((resolve, reject) => {
      stream.on('data', (keys: string[]) => {
        if (keys.length > 0) {
          redis.del(...keys).catch(() => {});
        }
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  } catch {
    // Silently fail for cache operations
  }
}
