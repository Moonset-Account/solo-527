import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import type { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-store';
import configuration from './config/configuration';
import { ServicesModule } from './modules/services/services.module';
import { WorkersModule } from './modules/workers/workers.module';
import { ConfigsModule } from './modules/configs/configs.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { UsersModule } from './modules/users/users.module';
import { AddressesModule } from './modules/addresses/addresses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync<any>({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const store = redisStore as unknown as CacheStore;
        return {
          store: store,
          socket: {
            host: configService.get<string>('redis.host'),
            port: configService.get<number>('redis.port'),
          },
          password: configService.get<string>('redis.password'),
          database: configService.get<number>('redis.db'),
          ttl: configService.get<number>('redis.ttl'),
        };
      },
      inject: [ConfigService],
    }),
    ServicesModule,
    WorkersModule,
    ConfigsModule,
    OrdersModule,
    AnalyticsModule,
    ReviewsModule,
    UsersModule,
    AddressesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
