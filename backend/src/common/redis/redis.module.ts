import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const host = configService.get('redis.host');
        const port = configService.get('redis.port');
        const password = configService.get('redis.password');
        const db = configService.get('redis.db');
        const url = password
          ? `redis://:${password}@${host}:${port}/${db}`
          : `redis://${host}:${port}/${db}`;
        const client = createClient({ url });
        client.on('error', (err) => console.error('Redis Client Error', err));
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
