import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './common/database.module';
import { ContentModule } from './modules/content/content.module';
import { ReviewModule } from './modules/review/review.module';
import { StatsModule } from './modules/stats/stats.module';
import { OperationModule } from './modules/operation/operation.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        try {
          const store = (await redisStore({
            socket: {
              host: process.env.REDIS_HOST || '127.0.0.1',
              port: Number(process.env.REDIS_PORT) || 6379,
              connectTimeout: 3000,
            },
            database: Number(process.env.REDIS_DB) || 0,
            ttl: 60,
          })) as any;
          console.log('[Cache] Redis cache connected');
          return { store, ttl: 60 };
        } catch (err) {
          console.warn('[Cache] Redis unavailable, falling back to memory cache:', err.message);
          return { ttl: 60 };
        }
      },
    }),
    CommonModule,
    ContentModule,
    ReviewModule,
    StatsModule,
    OperationModule,
    SettingsModule,
  ],
})
export class AppModule {}
