import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityRecord, ActivityRecordDocument } from './activity.schema';
import { ActivityType } from '../../common/enums';
import { DEFAULT_MEMBERS } from '../../common/constants/default-members';

@Injectable()
export class ActivityService {
  constructor(@InjectModel(ActivityRecord.name) private activityModel: Model<ActivityRecordDocument>) {
    this.initDefaultData();
  }

  async initDefaultData() {
    const count = await this.activityModel.countDocuments();
    if (count === 0) {
      const now = new Date();
      const types = [ActivityType.LOGIN, ActivityType.PURCHASE, ActivityType.SIGNIN, ActivityType.BROWSE, ActivityType.SHARE];
      const products = [
        { name: '水润保湿精华液', id: 'P001' },
        { name: '丝绒哑光口红', id: 'P002' },
        { name: '净透洁面乳', id: 'P003' },
        { name: '修护面膜套装', id: 'P004' },
        { name: '防晒隔离霜', id: 'P005' },
      ];

      const records = [];
      for (let i = 0; i < 50; i++) {
        const member = DEFAULT_MEMBERS[Math.floor(Math.random() * DEFAULT_MEMBERS.length)];
        const typeIdx = Math.floor(Math.random() * types.length);
        const type = types[typeIdx];
        const product = products[Math.floor(Math.random() * products.length)];
        const createdAt = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 3600 * 1000 - Math.floor(Math.random() * 86400) * 1000);

        records.push({
          activityNo: `ACT${Date.now()}${i.toString().padStart(5, '0')}`,
          memberId: new Types.ObjectId(member._id),
          memberName: member.name,
          memberPhone: member.phone,
          type,
          description: this.getDescription(type, product.name),
          storeId: 'store001',
          storeName: '青禾美妆-南京路店',
          productId: type === ActivityType.PURCHASE || type === ActivityType.BROWSE ? product.id : undefined,
          productName: type === ActivityType.PURCHASE || type === ActivityType.BROWSE ? product.name : undefined,
          orderNo: type === ActivityType.PURCHASE ? `ORD${Math.floor(Math.random() * 100000)}` : undefined,
          amount: type === ActivityType.PURCHASE ? Math.floor(Math.random() * 500 + 50) : undefined,
          points: type === ActivityType.PURCHASE || type === ActivityType.SIGNIN ? Math.floor(Math.random() * 100 + 10) : undefined,
          duration: type === ActivityType.BROWSE ? Math.floor(Math.random() * 600) : undefined,
          source: ['APP', '小程序', 'H5'][Math.floor(Math.random() * 3)],
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          createdAt,
        });
      }
      await this.activityModel.create(records);
      console.log('✅ 默认活跃记录已创建');
    }
  }

  private getDescription(type: ActivityType, productName: string): string {
    const descMap = {
      [ActivityType.LOGIN]: '会员登录',
      [ActivityType.PURCHASE]: `购买了${productName}`,
      [ActivityType.SIGNIN]: '每日签到',
      [ActivityType.BROWSE]: `浏览了${productName}`,
      [ActivityType.SHARE]: '分享了商品',
    };
    return descMap[type];
  }

  async findAll(params: any = {}) {
    const { page = 1, pageSize = 20, keyword, type, memberId, startDate, endDate, storeId } = params;
    const query: any = {};

    if (keyword) {
      query.$or = [
        { memberName: { $regex: keyword, $options: 'i' } },
        { memberPhone: { $regex: keyword } },
        { activityNo: { $regex: keyword } },
        { description: { $regex: keyword, $options: 'i' } },
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
      this.activityModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      this.activityModel.countDocuments(query),
    ]);
    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findById(id: string) {
    return this.activityModel.findById(id);
  }

  async getSummary(params: any = {}) {
    const { startDate, endDate, storeId } = params;
    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate + 'T23:59:59');
    }
    if (storeId) match.storeId = storeId;

    const [byType, dailyStats, total] = await Promise.all([
      this.activityModel.aggregate([
        { $match: match },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.activityModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            uniqueMembers: { $addToSet: '$memberId' },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]).then(daily => daily.map(d => ({
        date: d._id,
        count: d.count,
        activeMembers: d.uniqueMembers.length,
      }))),
      this.activityModel.countDocuments(match),
    ]);

    return { total, byType, dailyStats };
  }

  async create(data: Partial<ActivityRecord>) {
    return this.activityModel.create(data);
  }
}
