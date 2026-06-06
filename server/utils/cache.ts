import Redis from 'ioredis';
import crypto from 'crypto';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
});

export const CACHE_TTL = {
  QUICK: 60,
  SHORT: 15 * 60,
  MEDIUM: 60 * 60,
  LONG: 24 * 60 * 60,
  EXPORT: 7 * 24 * 60 * 60,
};

export function generateCacheKey(endpoint: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, unknown>);
  
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(sortedParams))
    .digest('hex');
  
  return `api:${endpoint}:${hash}`;
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCachedData<T>(
  key: string, 
  data: T, 
  ttl: number = CACHE_TTL.SHORT
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis invalidate error:', error);
  }
}
