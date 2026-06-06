import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 50, 2000);
      },
    });

    redis.on('error', (err) => {
      console.warn('Redis connection error:', err.message);
    });
  }
  return redis;
}

export default getRedis;
