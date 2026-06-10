import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PointsRecord, PointsRecordDocument } from './points.schema';
import { PointsType } from '../../common/enums';

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
      const members = [
        { name: '张美丽', phone: '13900000001', id: '650000000000000000000001' },
        { name: '李小花', phone: '13900000002', id: '650000000000000000000002' },
        { name: '王芳芳', phone: '13900000003', id: '650000000000000000000003' },
        { name: '赵雅婷', phone: '13900000004', id: '650000000000000000000004' },
        { name: '陈思琪', phone: '13900000005', id: '650000000000000000000005' },
      ];

      const records = [];
      for (let i = 0; i < 20; i++) {
        const member = members[Math.floor(Math.random() * members.length)];
        const typeIdx = Math.floor(Math.random() * types.length);
        const points = typeIdx === 1 ? -Math.floor(Math.random() * 500 + 50) : Math.floor(Math.random() * 1000 + 10);
        records.push({
          recordNo: `PT${Date.now()}${i.toString().padStart(4, '0')}`,
          memberId: new Types.ObjectId(member.id),
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
