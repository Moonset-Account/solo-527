import Redis from "ioredis";
import { config } from "../config.js";

let redisClient = null;
let redisAvailable = false;

export async function initCache() {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn("Redis 重试次数过多，禁用缓存");
          redisAvailable = false;
          return null;
        }
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis 缓存连接成功");
      redisAvailable = true;
    });

    redisClient.on("error", (err) => {
      console.warn("❌ Redis 连接错误:", err.message);
      redisAvailable = false;
    });

    redisClient.on("close", () => {
      redisAvailable = false;
    });
  } catch (err) {
    console.warn("Redis 初始化失败，缓存已禁用:", err.message);
    redisAvailable = false;
  }

  return redisClient;
}

export function isCacheAvailable() {
  return redisAvailable && redisClient !== null;
}

export async function getCache(key) {
  if (!isCacheAvailable()) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

export async function setCache(key, value, ttl = config.cache.defaultTTL) {
  if (!isCacheAvailable()) return false;
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", ttl);
    return true;
  } catch (err) {
    return false;
  }
}

export async function deleteCache(key) {
  if (!isCacheAvailable()) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    return false;
  }
}

export async function deleteCachePattern(pattern) {
  if (!isCacheAvailable()) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (err) {
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
