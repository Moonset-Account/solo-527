import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

class RedisClient {
  private client: Redis;
  private static instance: RedisClient;

  private constructor() {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryDelayOnFailover: 100,
    });

    this.client.on("error", (err) => {
      console.error("Redis client error:", err);
    });

    this.client.on("connect", () => {
      console.log("Redis client connected");
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient(): Redis {
    return this.client;
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      console.error(`Redis get error for key ${key}:`, err);
      return null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.set(key, value, "EX", ttl);
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      console.error(`Redis set error for key ${key}:`, err);
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error(`Redis del error for key ${key}:`, err);
    }
  }

  public async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  public async setJSON(key: string, value: unknown, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  public async acquireLock(key: string, timeout: number = 5000): Promise<boolean> {
    const lockKey = `cache:lock:${key}`;
    const result = await this.client.set(lockKey, "1", "PX", timeout, "NX");
    return result === "OK";
  }

  public async releaseLock(key: string): Promise<void> {
    const lockKey = `cache:lock:${key}`;
    await this.del(lockKey);
  }

  public async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

export const redis = RedisClient.getInstance();
export const redisClient = redis.getClient();
