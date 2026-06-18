import { Module, Global, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.configService.get<string>('REDIS_PORT', '6379')),
      password: this.configService.get<string>('REDIS_PASSWORD', ''),
      db: Number(this.configService.get<string>('REDIS_DB', '0')),
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async enqueue(queueName: string, data: string): Promise<void> {
    await this.client.rpush(queueName, data);
  }

  async dequeue(queueName: string): Promise<string | null> {
    const result = await this.client.lpop(queueName);
    return result;
  }

  async getQueueLength(queueName: string): Promise<number> {
    return this.client.llen(queueName);
  }

  getClient(): Redis {
    return this.client;
  }
}

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
