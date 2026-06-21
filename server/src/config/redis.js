import { createClient } from 'redis';

export const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
});

redisClient.on('error', (err) => console.error('Redis 客户端错误:', err));
redisClient.on('connect', () => console.log('🔴 Redis 连接成功'));

export default redisClient;
