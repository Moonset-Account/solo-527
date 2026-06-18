import { Module, Global, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis | null = null;
  private connected = false;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {
    this.connect();
  }

  private connect() {
    try {
      this.client = new Redis({
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: Number(this.configService.get<string>('REDIS_PORT', '6379')),
        password: this.configService.get<string>('REDIS_PASSWORD', ''),
        db: Number(this.configService.get<string>('REDIS_DB', '0')),
        lazyConnect: true,
        retryStrategy: () => null,
      });

      this.client.on('error', (err) => {
        if (this.connected) {
          this.logger.warn('Redis connection error: ' + err.message);
          this.connected = false;
        }
      });

      this.client.on('connect', () => {
        this.connected = true;
        this.logger.log('Redis connected');
      });

      this.client.connect().catch((err) => {
        this.logger.warn('Redis connection failed: ' + err.message + '. Running without cache.');
        this.connected = false;
      });
    } catch (err: any) {
      this.logger.warn('Redis init failed: ' + err.message + '. Running without cache.');
      this.connected = false;
    }
  }

  private warn() {
    this.logger.warn('Redis not connected, skipping cache operation');
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.connected) { this.warn(); return null; }
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.connected) { this.warn(); return; }
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.connected) { this.warn(); return; }
    await this.client.del(key);
  }

  async enqueue(queueName: string, data: string): Promise<void> {
    if (!this.client || !this.connected) { this.warn(); return; }
    await this.client.rpush(queueName, data);
  }

  async dequeue(queueName: string): Promise<string | null> {
    if (!this.client || !this.connected) { this.warn(); return null; }
    const result = await this.client.lpop(queueName);
    return result;
  }

  async getQueueLength(queueName: string): Promise<number> {
    if (!this.client || !this.connected) { this.warn(); return 0; }
    return this.client.llen(queueName);
  }

  getClient(): Redis | null {
    return this.client;
  }
}

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
