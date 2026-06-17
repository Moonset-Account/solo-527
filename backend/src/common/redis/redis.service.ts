import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: any) {}

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await this.redisClient.set(key, serialized, { EX: ttl });
    } else {
      await this.redisClient.set(key, serialized);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value as unknown as T;
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redisClient.exists(key)) > 0;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redisClient.expire(key, seconds);
  }

  async incr(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  async hset(key: string, field: string, value: any): Promise<void> {
    await this.redisClient.hSet(key, field, typeof value === 'string' ? value : JSON.stringify(value));
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    const value = await this.redisClient.hGet(key, field);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value as unknown as T;
    }
  }

  async publish(channel: string, message: any): Promise<void> {
    await this.redisClient.publish(channel, typeof message === 'string' ? message : JSON.stringify(message));
  }
}
