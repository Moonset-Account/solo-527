import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private connected = false;

  async onModuleInit() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryStrategy: () => null,
        lazyConnect: true,
        connectTimeout: 3000,
      });

      await this.client.connect();
      this.connected = true;
      this.logger.log('Redis connected');
    } catch {
      this.connected = false;
      this.logger.warn('Redis unavailable, running without cache');
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async get(key: string): Promise<string | null> {
    if (!this.connected || !this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // ignore
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // ignore
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.connected || !this.client) return false;
    try {
      const result = await this.client.exists(key);
      return result > 0;
    } catch {
      return false;
    }
  }
}
