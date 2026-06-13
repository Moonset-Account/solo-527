import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { CommonModule } from './common/common.module';
import { ContentModule } from './modules/content/content.module';
import { ReviewModule } from './modules/review/review.module';
import { StatsModule } from './modules/stats/stats.module';
import { OperationModule } from './modules/operation/operation.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/brand_video_review'),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: (await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
          },
          database: Number(process.env.REDIS_DB) || 0,
        })) as any,
      }),
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
