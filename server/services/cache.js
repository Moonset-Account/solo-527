import Redis from "ioredis";
import { config } from "../config.js";

let redisClient = null;

export async function initCache() {
  if (redisClient) return redisClient;

  redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis 缓存连接成功");
  });

  redisClient.on("error", (err) => {
    console.error("❌ Redis 连接错误:", err.message);
  });

  return redisClient;
}

export async function getCache(key) {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("缓存读取错误:", err);
    return null;
  }
}

export async function setCache(key, value, ttl = config.cache.defaultTTL) {
  if (!redisClient) return false;
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", ttl);
    return true;
  } catch (err) {
    console.error("缓存写入错误:", err);
    return false;
  }
}

export async function deleteCache(key) {
  if (!redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    console.error("缓存删除错误:", err);
    return false;
  }
}

export async function deleteCachePattern(pattern) {
  if (!redisClient) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (err) {
    console.error("缓存批量删除错误:", err);
    return false;
  }
}

export function generateCacheKey(prefix, params) {
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `${prefix}:${sortedParams}`;
}

export { redisClient };
