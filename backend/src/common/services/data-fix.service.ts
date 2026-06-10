import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Member, MemberDocument } from '../../modules/member/member.schema';
import { Coupon, CouponDocument } from '../../modules/coupon/coupon.schema';
import { PointsRecord, PointsRecordDocument } from '../../modules/points/points.schema';
import { RedeemRecord, RedeemRecordDocument } from '../../modules/redeem/redeem.schema';
import { ActivityRecord, ActivityRecordDocument } from '../../modules/activity/activity.schema';
import { ReachLog, ReachLogDocument } from '../../modules/reach-log/reach-log.schema';

interface CollectionMeta {
  name: string;
  model: Model<any>;
}

@Injectable()
export class DataFixService implements OnModuleInit {
  constructor(
    @InjectModel(Member.name) private memberModel: Model<MemberDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    @InjectModel(PointsRecord.name) private pointsModel: Model<PointsRecordDocument>,
    @InjectModel(RedeemRecord.name) private redeemModel: Model<RedeemRecordDocument>,
    @InjectModel(ActivityRecord.name) private activityModel: Model<ActivityRecordDocument>,
    @InjectModel(ReachLog.name) private reachLogModel: Model<ReachLogDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.fixAllMemberReferences();
    } catch (e) {
      console.error('❌ 会员ID纠偏执行失败:', e.message);
    }
  }

  async fixAllMemberReferences() {
    const members = await this.memberModel.find({ active: true });
    if (members.length === 0) return;

    const phoneMap = new Map<string, Types.ObjectId>();
    const memberNoMap = new Map<string, Types.ObjectId>();
    const nameMap = new Map<string, Types.ObjectId>();

    for (const m of members) {
      if (m.phone) phoneMap.set(m.phone, m._id);
      if (m.memberNo) memberNoMap.set(m.memberNo, m._id);
      if (m.name) nameMap.set(m.name, m._id);
    }

    const resolveId = (rec: any): Types.ObjectId | undefined => {
      if (rec.memberPhone && phoneMap.has(rec.memberPhone)) return phoneMap.get(rec.memberPhone);
      if (rec.memberNo && memberNoMap.has(rec.memberNo)) return memberNoMap.get(rec.memberNo);
      if (rec.memberName && nameMap.has(rec.memberName)) return nameMap.get(rec.memberName);
      return undefined;
    };

    const collections: CollectionMeta[] = [
      { name: '优惠券', model: this.couponModel },
      { name: '积分记录', model: this.pointsModel },
      { name: '兑换记录', model: this.redeemModel },
      { name: '活跃记录', model: this.activityModel },
      { name: '触达日志', model: this.reachLogModel },
    ];

    for (const col of collections) {
      const records = await col.model.find({});
      const bulk = col.model.collection.initializeUnorderedBulkOp();
      let changed = 0;

      for (const r of records) {
        const targetId = resolveId(r);
        if (!targetId) continue;
        const currentId: Types.ObjectId | undefined = r.memberId;
        if (!currentId || !currentId.equals(targetId)) {
          bulk.find({ _id: r._id }).updateOne({ $set: { memberId: targetId } });
          changed++;
        }
      }

      if (changed > 0) {
        await bulk.execute();
        console.log(`🔧 [${col.name}] 会员ID纠偏完成，更新 ${changed} 条`);
      }
    }
  }
}
