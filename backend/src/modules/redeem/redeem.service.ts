import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RedeemRecord, RedeemRecordDocument } from './redeem.schema';
import { RedeemStatus } from '../../common/enums';
import { DEFAULT_MEMBERS } from '../../common/constants/default-members';

@Injectable()
export class RedeemService {
  constructor(@InjectModel(RedeemRecord.name) private redeemModel: Model<RedeemRecordDocument>) {
    this.initDefaultData();
  }

  async initDefaultData() {
    const count = await this.redeemModel.countDocuments();
    if (count === 0) {
      const now = new Date();
      const benefits = ['生日双倍积分券', '9折折扣券', '50元现金券', '免费试用装', '专属美容服务'];
      const statuses = [RedeemStatus.SUCCESS, RedeemStatus.SUCCESS, RedeemStatus.PENDING, RedeemStatus.FAILED, RedeemStatus.SUCCESS];
      const operators = ['小王', '小李', '小张'];

      const records = [];
      for (let i = 0; i < 15; i++) {
        const member = DEFAULT_MEMBERS[Math.floor(Math.random() * DEFAULT_MEMBERS.length)];
        const benefitIdx = Math.floor(Math.random() * benefits.length);
        const status = statuses[benefitIdx];
        const redeemTime = new Date(now.getTime() - Math.floor(Math.random() * 60) * 24 * 3600 * 1000);
        records.push({
          redeemNo: `RM${Date.now()}${i.toString().padStart(4, '0')}`,
          memberId: new Types.ObjectId(member._id),
          memberName: member.name,
          memberPhone: member.phone,
          benefitName: benefits[benefitIdx],
          benefitId: `BEN${benefitIdx + 1}`,
          pointsCost: [500, 800, 1000, 2000, 3000][benefitIdx],
          status,
          storeId: 'store001',
          storeName: '青禾美妆-南京路店',
          operatorName: operators[Math.floor(Math.random() * operators.length)],
          failReason: status === RedeemStatus.FAILED ? '积分不足' : undefined,
          redeemTime,
          createdAt: redeemTime,
        });
      }
      await this.redeemModel.create(records);
      console.log('✅ 默认兑换记录已创建');
    }
    await this.fixMemberReferences();
  }

  async fixMemberReferences() {
    const phoneMap = new Map(DEFAULT_MEMBERS.map(m => [m.phone, new Types.ObjectId(m._id)]));
    const nameMap = new Map(DEFAULT_MEMBERS.map(m => [m.name, new Types.ObjectId(m._id)]));
    const records = await this.redeemModel.find({});
    const bulk = this.redeemModel.collection.initializeUnorderedBulkOp();
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
      console.log(`🔧 兑换记录会员ID纠偏完成，更新 ${changed} 条`);
    }
  }

  async findAll(params: any = {}) {
    const { page = 1, pageSize = 20, keyword, status, startDate, endDate, storeId, operatorName, memberId } = params;
    const query: any = {};

    if (keyword) {
      query.$or = [
        { memberName: { $regex: keyword, $options: 'i' } },
        { memberPhone: { $regex: keyword } },
        { redeemNo: { $regex: keyword } },
        { benefitName: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (memberId) query.memberId = new Types.ObjectId(memberId);
    if (startDate || endDate) {
      query.redeemTime = {};
      if (startDate) query.redeemTime.$gte = new Date(startDate);
      if (endDate) query.redeemTime.$lte = new Date(endDate + 'T23:59:59');
    }
    if (operatorName) query.operatorName = { $regex: operatorName, $options: 'i' };
    if (storeId) query.storeId = storeId;

    const [list, total] = await Promise.all([
      this.redeemModel.find(query).sort({ redeemTime: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      this.redeemModel.countDocuments(query),
    ]);
    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findById(id: string) {
    return this.redeemModel.findById(id);
  }

  async create(data: Partial<RedeemRecord>) {
    return this.redeemModel.create(data);
  }

  async updateStatus(id: string, status: RedeemStatus, failReason?: string) {
    const update: any = { status };
    if (failReason) update.failReason = failReason;
    if (status === RedeemStatus.SUCCESS) update.redeemTime = new Date();
    return this.redeemModel.findByIdAndUpdate(id, update, { new: true });
  }

  async getStats() {
    const total = await this.redeemModel.countDocuments();
    const byStatus = await this.redeemModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalPoints: { $sum: '$pointsCost' } } },
    ]);
    return { total, byStatus };
  }
}
