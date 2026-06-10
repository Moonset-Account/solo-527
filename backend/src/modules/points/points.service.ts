import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PointsRecord, PointsRecordDocument } from './points.schema';
import { PointsType } from '../../common/enums';
import { DEFAULT_MEMBERS } from '../../common/constants/default-members';

@Injectable()
export class PointsService {
  constructor(@InjectModel(PointsRecord.name) private pointsModel: Model<PointsRecordDocument>) {
    this.initDefaultData();
  }

  async initDefaultData() {
    const count = await this.pointsModel.countDocuments();
    if (count === 0) {
      const now = new Date();
      const types = [PointsType.EARN, PointsType.CONSUME, PointsType.EARN, PointsType.EARN, PointsType.CONSUME];
      const sources = ['购物消费', '积分兑换', '签到奖励', '活动赠送', '生日双倍'];

      const records = [];
      for (let i = 0; i < 20; i++) {
        const member = DEFAULT_MEMBERS[Math.floor(Math.random() * DEFAULT_MEMBERS.length)];
        const typeIdx = Math.floor(Math.random() * types.length);
        const points = typeIdx === 1 ? -Math.floor(Math.random() * 500 + 50) : Math.floor(Math.random() * 1000 + 10);
        records.push({
          recordNo: `PT${Date.now()}${i.toString().padStart(4, '0')}`,
          memberId: new Types.ObjectId(member._id),
          memberName: member.name,
          memberPhone: member.phone,
          type: types[typeIdx],
          points,
          balanceAfter: Math.floor(Math.random() * 50000),
          source: sources[typeIdx],
          orderNo: typeIdx === 0 ? `ORD${Math.floor(Math.random() * 100000)}` : undefined,
          storeId: 'store001',
          storeName: '青禾美妆-南京路店',
          operatorName: ['小王', '小李', '系统'][Math.floor(Math.random() * 3)],
          createdAt: new Date(now.getTime() - Math.floor(Math.random() * 90) * 24 * 3600 * 1000),
        });
      }
      await this.pointsModel.create(records);
      console.log('✅ 默认积分记录已创建');
    }
    await this.fixMemberReferences();
  }

  async fixMemberReferences() {
    const phoneMap = new Map(DEFAULT_MEMBERS.map(m => [m.phone, new Types.ObjectId(m._id)]));
    const nameMap = new Map(DEFAULT_MEMBERS.map(m => [m.name, new Types.ObjectId(m._id)]));
    const records = await this.pointsModel.find({});
    const bulk = this.pointsModel.collection.initializeUnorderedBulkOp();
    let changed = 0;
    for (const r of records) {
      const targetId = phoneMap.get(r.memberPhone) || nameMap.get(r.memberName);
      if (targetId && !r.memberId?.equals(targetId)) {
        bulk.find({ _id: r._id }).updateOne({ $set: { memberId: targetId } });
        changed++;
      }
    }
    if (changed > 0) {
      await bulk.execute();
      console.log(`🔧 积分记录会员ID纠偏完成，更新 ${changed} 条`);
    }
  }

  async findAll(params: any = {}) {
    const { page = 1, pageSize = 20, keyword, type, startDate, endDate, storeId, memberId } = params;
    const query: any = {};

    if (keyword) {
      query.$or = [
        { memberName: { $regex: keyword, $options: 'i' } },
        { memberPhone: { $regex: keyword } },
        { recordNo: { $regex: keyword } },
        { source: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (type) query.type = type;
    if (memberId) query.memberId = new Types.ObjectId(memberId);
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
    }
    if (storeId) query.storeId = storeId;

    const [list, total] = await Promise.all([
      this.pointsModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      this.pointsModel.countDocuments(query),
    ]);
    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findById(id: string) {
    return this.pointsModel.findById(id);
  }

  async create(data: Partial<PointsRecord>) {
    return this.pointsModel.create(data);
  }

  async getMemberPointsSummary(memberId: string) {
    const records = await this.pointsModel.find({ memberId: new Types.ObjectId(memberId) });
    const totalEarn = records.filter(r => r.type === PointsType.EARN).reduce((sum, r) => sum + r.points, 0);
    const totalConsume = records.filter(r => r.type === PointsType.CONSUME).reduce((sum, r) => sum + Math.abs(r.points), 0);
    return { totalEarn, totalConsume, records: records.length };
  }

  async getStats() {
    const totalRecords = await this.pointsModel.countDocuments();
    const byType = await this.pointsModel.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, totalPoints: { $sum: '$points' } } },
    ]);
    return { totalRecords, byType };
  }
}
