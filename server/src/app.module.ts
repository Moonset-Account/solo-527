import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';
import { ItemModule } from './modules/item/item.module.js';
import { ReviewModule } from './modules/review/review.module.js';
import { ConfigModule } from './modules/config/config.module.js';
import { LogModule } from './modules/log/log.module.js';
import { RedisModule } from './modules/redis/redis.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/item-closure'),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    ItemModule,
    ReviewModule,
    ConfigModule,
    LogModule,
    RedisModule,
  ],
})
export class AppModule {}
