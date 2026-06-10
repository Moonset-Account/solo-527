import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

import { AuthModule } from './modules/auth/auth.module';
import { MemberModule } from './modules/member/member.module';
import { LevelModule } from './modules/level/level.module';
import { BenefitModule } from './modules/benefit/benefit.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { PointsModule } from './modules/points/points.module';
import { RedeemModule } from './modules/redeem/redeem.module';
import { ActivityModule } from './modules/activity/activity.module';
import { ReachLogModule } from './modules/reach-log/reach-log.module';
import { ReportModule } from './modules/report/report.module';
import { EnvModule } from './modules/env/env.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/qinghe_member'),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: redisStore as any,
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
        },
        database: Number(process.env.REDIS_DB) || 0,
      }),
    }),
    AuthModule,
    MemberModule,
    LevelModule,
    BenefitModule,
    CouponModule,
    PointsModule,
    RedeemModule,
    ActivityModule,
    ReachLogModule,
    ReportModule,
    EnvModule,
  ],
})
export class AppModule {}
