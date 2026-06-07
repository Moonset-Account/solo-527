import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.on("connect", () => {
  console.log("Redis connected");
});

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 1800,
  DAY: 86400,
};

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Cache get error:", err);
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM) {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error("Cache set error:", err);
  }
}

export async function cacheDelete(key: string) {
  try {
    await redis.del(key);
  } catch (err) {
    console.error("Cache delete error:", err);
  }
}

export function getCacheKey(prefix: string, params: Record<string, any>): string {
  const sorted = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  return `${prefix}:${sorted}`;
}
