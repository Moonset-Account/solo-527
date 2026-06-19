import { createClient, RedisClientType } from 'redis';
import { config } from '../config';

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient && redisClient.isReady) {
    return redisClient;
  }

  redisClient = createClient({
    url: config.redis.url,
  });

  redisClient.on('error', (err) => {
    console.error('[Redis] Client error:', err);
  });

  redisClient.on('connect', () => {
    console.log(`[Redis] Connected to ${config.redis.url}`);
  });

  await redisClient.connect();
  return redisClient;
}

export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Disconnected');
  }
}
