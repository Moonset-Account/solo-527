import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LevelRule, LevelRuleDocument } from './level.schema';
import { MemberLevel } from '../../common/enums';

@Injectable()
export class LevelService {
  constructor(@InjectModel(LevelRule.name) private levelModel: Model<LevelRuleDocument>) {
    this.initDefaultLevels();
  }

  async initDefaultLevels() {
    const count = await this.levelModel.countDocuments();
    if (count === 0) {
      await this.levelModel.create([
        {
          level: MemberLevel.BRONZE,
          levelName: '青铜会员',
          minPoints: 0,
          minConsumption: 0,
          minOrderCount: 0,
          color: '#CD7F32',
          icon: '🥉',
          description: '注册即享，开启美妆之旅',
          pointsMultiplier: 1,
          sort: 1,
        },
        {
          level: MemberLevel.SILVER,
          levelName: '白银会员',
          minPoints: 1000,
          minConsumption: 500,
          minOrderCount: 3,
          color: '#C0C0C0',
          icon: '🥈',
          description: '专享95折优惠，生日双倍积分',
          pointsMultiplier: 1.2,
          sort: 2,
        },
        {
          level: MemberLevel.GOLD,
          levelName: '黄金会员',
          minPoints: 5000,
          minConsumption: 2000,
          minOrderCount: 10,
          color: '#FFD700',
          icon: '🥇',
          description: '专享9折优惠，免费试用新品',
          pointsMultiplier: 1.5,
          sort: 3,
        },
        {
          level: MemberLevel.PLATINUM,
          levelName: '铂金会员',
          minPoints: 20000,
          minConsumption: 8000,
          minOrderCount: 25,
          color: '#E5E4E2',
          icon: '💎',
          description: '专享85折，专属美容顾问',
          pointsMultiplier: 2,
          sort: 4,
        },
        {
          level: MemberLevel.DIAMOND,
          levelName: '钻石会员',
          minPoints: 50000,
          minConsumption: 20000,
          minOrderCount: 50,
          color: '#B9F2FF',
          icon: '👑',
          description: '专享8折，VIP专属活动，优先体验',
          pointsMultiplier: 3,
          sort: 5,
        },
      ]);
      console.log('✅ 默认等级规则已创建');
    }
  }

  async findAll(enabledOnly = false) {
    const query = enabledOnly ? { enabled: true } : {};
    return this.levelModel.find(query).sort({ sort: 1 });
  }

  async findById(id: string) {
    return this.levelModel.findById(id);
  }

  async findByLevel(level: MemberLevel) {
    return this.levelModel.findOne({ level });
  }

  async create(data: Partial<LevelRule>) {
    return this.levelModel.create(data);
  }

  async update(id: string, data: Partial<LevelRule>) {
    return this.levelModel.findByIdAndUpdate(id, data, { new: true });
  }

  async remove(id: string) {
    return this.levelModel.findByIdAndDelete(id);
  }

  async calculateLevel(points: number, consumption: number, orderCount: number) {
    const levels = await this.findAll(true);
    let currentLevel = levels[0];
    for (const level of levels) {
      if (
        points >= level.minPoints &&
        consumption >= level.minConsumption &&
        orderCount >= level.minOrderCount
      ) {
        currentLevel = level;
      }
    }
    return currentLevel;
  }
}
