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
import { DataFixService } from './common/services/data-fix.service';
import { Member, MemberSchema } from './modules/member/member.schema';
import { Coupon, CouponSchema } from './modules/coupon/coupon.schema';
import { PointsRecord, PointsRecordSchema } from './modules/points/points.schema';
import { RedeemRecord, RedeemRecordSchema } from './modules/redeem/redeem.schema';
import { ActivityRecord, ActivityRecordSchema } from './modules/activity/activity.schema';
import { ReachLog, ReachLogSchema } from './modules/reach-log/reach-log.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/qinghe_member'),
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: PointsRecord.name, schema: PointsRecordSchema },
      { name: RedeemRecord.name, schema: RedeemRecordSchema },
      { name: ActivityRecord.name, schema: ActivityRecordSchema },
      { name: ReachLog.name, schema: ReachLogSchema },
    ]),
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
  providers: [DataFixService],
})
export class AppModule {}
