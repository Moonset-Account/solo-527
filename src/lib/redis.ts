import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisGlobal = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = redisGlobal.redis ?? new Redis(redisUrl);

if (process.env.NODE_ENV !== 'production') redisGlobal.redis = redis;

export const REMINDER_QUEUE_KEY = 'contract:reminder:queue';
export const EFFICIENCY_CACHE_PREFIX = 'contract:efficiency:';
export const MATERIAL_STATUS_PREFIX = 'contract:material:';

export async function pushReminderQueue(data: {
  contractId?: string;
  userId?: string;
  type: string;
  message: string;
}) {
  await redis.lpush(REMINDER_QUEUE_KEY, JSON.stringify(data));
}

export async function popReminderQueue() {
  const item = await redis.rpop(REMINDER_QUEUE_KEY);
  return item ? JSON.parse(item) : null;
}

export async function setCache(key: string, value: any, ttlSeconds = 3600) {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}
