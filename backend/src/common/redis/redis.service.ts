import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    this.client = new Redis({
      host,
      port,
      password,
      db: this.configService.get<number>('REDIS_DB', 0),
      lazyConnect: true,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(`Redis reconnecting... attempt ${times}, delay ${delay}ms`);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log(`✅ Redis connected to ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.logger.error(`❌ Redis connection error: ${err.message}`);
    });

    this.client.on('close', () => {
      this.logger.warn('⚠️  Redis connection closed');
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      this.logger.error(`Get ${key} failed: ${err.message}`);
      return null;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      this.logger.error(`Set ${key} failed: ${err.message}`);
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error(`Del ${key} failed: ${err.message}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err) {
      this.logger.error(`Del pattern ${pattern} failed: ${err.message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) > 0;
    } catch {
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch {
      return 0;
    }
  }
}
