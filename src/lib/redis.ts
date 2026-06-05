import Redis from 'ioredis';

const redisClientSingleton = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

type RedisClientSingleton = ReturnType<typeof redisClientSingleton>;

const globalForRedis = globalThis as unknown as {
  redis: RedisClientSingleton | undefined;
};

export const redis = globalForRedis.redis ?? redisClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export default redis;
