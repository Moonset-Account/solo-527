import { createClient, RedisClientType } from "redis";
import { config } from "../config";

let client: RedisClientType | null = null;

export async function connectRedis() {
  if (client) {
    return client;
  }

  try {
    client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    });

    client.on("error", (err) => {
      console.error("[Redis] Client error:", err);
    });

    client.on("connect", () => {
      console.log(
        `[Redis] Connected to: ${config.redis.host}:${config.redis.port}`
      );
    });

    await client.connect();
    return client;
  } catch (error) {
    console.warn(
      "[Redis] Failed to connect, continuing without cache:",
      (error as Error).message
    );
    return null;
  }
}

export function getRedisClient(): RedisClientType | null {
  return client;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = 300
) {
  if (!client) return;
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error("[Redis] cacheSet error:", err);
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!client) return null;
  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error("[Redis] cacheGet error:", err);
    return null;
  }
}

export async function cacheDel(key: string) {
  if (!client) return;
  try {
    await client.del(key);
  } catch (err) {
    console.error("[Redis] cacheDel error:", err);
  }
}
