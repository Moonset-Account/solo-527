import { createClient } from 'redis';

let redisClient = null;

export const connectRedis = async () => {
  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({ url });
    
    redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));
    redisClient.on('connect', () => console.log('✅ Redis connected successfully'));
    
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    return null;
  }
};

export const getRedisClient = () => redisClient;

export const cacheGet = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key, value, ttl = 300) => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis cache set error:', error);
  }
};

export const cacheDel = async (key) => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis cache del error:', error);
  }
};
