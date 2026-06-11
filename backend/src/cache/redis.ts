import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  return redisClient;
}

export async function initializeRedis(): Promise<void> {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('Redis connection failed after 3 retries, continuing without cache');
          return null;
        }
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.warn('Redis connection error:', err.message);
    });
  } catch (error) {
    console.warn('Redis initialization failed, continuing without cache');
    redisClient = null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // ignore cache errors
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch {
    // ignore cache errors
  }
}
