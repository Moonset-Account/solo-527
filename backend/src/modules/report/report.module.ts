import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Member, MemberSchema } from '../member/member.schema';
import { Coupon, CouponSchema } from '../coupon/coupon.schema';
import { PointsRecord, PointsRecordSchema } from '../points/points.schema';
import { RedeemRecord, RedeemRecordSchema } from '../redeem/redeem.schema';
import { ActivityRecord, ActivityRecordSchema } from '../activity/activity.schema';
import { ReachLog, ReachLogSchema } from '../reach-log/reach-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: PointsRecord.name, schema: PointsRecordSchema },
      { name: RedeemRecord.name, schema: RedeemRecordSchema },
      { name: ActivityRecord.name, schema: ActivityRecordSchema },
      { name: ReachLog.name, schema: ReachLogSchema },
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
