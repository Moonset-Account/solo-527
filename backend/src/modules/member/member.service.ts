import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Member, MemberDocument } from './member.schema';
import { MemberLevel } from '../../common/enums';
import { DEFAULT_MEMBERS } from '../../common/constants/default-members';
import { LevelService } from '../level/level.service';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel(Member.name) private memberModel: Model<MemberDocument>,
    private levelService: LevelService,
  ) {
    this.initDefaultMembers();
  }

  async initDefaultMembers() {
    const count = await this.memberModel.countDocuments();
    if (count === 0) {
      const members = [
        { memberNo: 'M20240001', name: '张美丽', phone: '13900000001', level: MemberLevel.DIAMOND, totalPoints: 68000, availablePoints: 45600, totalConsumption: 25800, orderCount: 68, storeId: 'store001', storeName: '青禾美妆-南京路店' },
        { memberNo: 'M20240002', name: '李小花', phone: '13900000002', level: MemberLevel.PLATINUM, totalPoints: 28000, availablePoints: 12300, totalConsumption: 9800, orderCount: 32, storeId: 'store001', storeName: '青禾美妆-南京路店' },
        { memberNo: 'M20240003', name: '王芳芳', phone: '13900000003', level: MemberLevel.GOLD, totalPoints: 8500, availablePoints: 3200, totalConsumption: 3200, orderCount: 15, storeId: 'store001', storeName: '青禾美妆-南京路店' },
        { memberNo: 'M20240004', name: '赵雅婷', phone: '13900000004', level: MemberLevel.SILVER, totalPoints: 2100, availablePoints: 800, totalConsumption: 850, orderCount: 5, storeId: 'store001', storeName: '青禾美妆-南京路店' },
        { memberNo: 'M20240005', name: '陈思琪', phone: '13900000005', level: MemberLevel.BRONZE, totalPoints: 200, availablePoints: 200, totalConsumption: 150, orderCount: 1, storeId: 'store001', storeName: '青禾美妆-南京路店' },
        { memberNo: 'M20240006', name: '刘梦瑶', phone: '13900000006', level: MemberLevel.GOLD, totalPoints: 6500, availablePoints: 2100, totalConsumption: 2500, orderCount: 12, storeId: 'store001', storeName: '青禾美妆-南京路店' },
        { memberNo: 'M20240007', name: '孙雨萱', phone: '13900000007', level: MemberLevel.SILVER, totalPoints: 1500, availablePoints: 600, totalConsumption: 600, orderCount: 4, storeId: 'store001', storeName: '青禾美妆-南京路店' },
        { memberNo: 'M20240008', name: '周佳怡', phone: '13900000008', level: MemberLevel.PLATINUM, totalPoints: 22000, availablePoints: 8500, totalConsumption: 8500, orderCount: 28, storeId: 'store001', storeName: '青禾美妆-南京路店' },
      ];
      const now = new Date();
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        const daysAgo = Math.floor(Math.random() * 365);
        const registerTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const lastActive = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
        await this.memberModel.create({
          _id: new Types.ObjectId(DEFAULT_MEMBERS[i]._id),
          ...m,
          registerTime,
          lastActiveTime: lastActive,
          avatar: '',
        });
      }
      console.log('✅ 默认会员数据已创建');
    }
  }

  async findAll(params: any = {}) {
    const { page = 1, pageSize = 20, keyword, level, storeId } = params;
    const query: any = { active: true };
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword } },
        { memberNo: { $regex: keyword } },
      ];
    }
    if (level) query.level = level;
    if (storeId) query.storeId = storeId;

    const [list, total] = await Promise.all([
      this.memberModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      this.memberModel.countDocuments(query),
    ]);
    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findById(id: string) {
    return this.memberModel.findById(id);
  }

  async findByMemberNo(memberNo: string) {
    return this.memberModel.findOne({ memberNo });
  }

  async create(data: Partial<Member>) {
    return this.memberModel.create(data);
  }

  async update(id: string, data: Partial<Member>) {
    return this.memberModel.findByIdAndUpdate(id, data, { new: true });
  }

  async getStats() {
    const total = await this.memberModel.countDocuments({ active: true });
    const levels = await this.memberModel.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$level', count: { $sum: 1 } } },
    ]);
    return { total, levelStats: levels };
  }
}
