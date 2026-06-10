import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Benefit, BenefitDocument, BenefitType } from './benefit.schema';
import { MemberLevel } from '../../common/enums';

@Injectable()
export class BenefitService {
  constructor(@InjectModel(Benefit.name) private benefitModel: Model<BenefitDocument>) {
    this.initDefaultBenefits();
  }

  async initDefaultBenefits() {
    const count = await this.benefitModel.countDocuments();
    if (count === 0) {
      await this.benefitModel.create([
        {
          name: '生日双倍积分',
          type: BenefitType.POINTS,
          description: '生日当月消费享双倍积分',
          icon: '🎂',
          value: '2倍',
          applicableLevels: [MemberLevel.SILVER, MemberLevel.GOLD, MemberLevel.PLATINUM, MemberLevel.DIAMOND],
          sort: 1,
        },
        {
          name: '专属折扣',
          type: BenefitType.DISCOUNT,
          description: '会员专享折扣优惠',
          icon: '🏷️',
          value: '95折起',
          applicableLevels: [MemberLevel.SILVER, MemberLevel.GOLD, MemberLevel.PLATINUM, MemberLevel.DIAMOND],
          sort: 2,
        },
        {
          name: '复购券礼包',
          type: BenefitType.COUPON,
          description: '每月领取复购优惠券',
          icon: '🎫',
          value: '50元',
          applicableLevels: [MemberLevel.GOLD, MemberLevel.PLATINUM, MemberLevel.DIAMOND],
          sort: 3,
        },
        {
          name: '免费试用',
          type: BenefitType.GIFT,
          description: '新品免费试用资格',
          icon: '🎁',
          value: '每月1次',
          applicableLevels: [MemberLevel.GOLD, MemberLevel.PLATINUM, MemberLevel.DIAMOND],
          sort: 4,
        },
        {
          name: '专属美容顾问',
          type: BenefitType.SERVICE,
          description: '一对一专属美容顾问服务',
          icon: '👩‍⚕️',
          value: '专属服务',
          applicableLevels: [MemberLevel.PLATINUM, MemberLevel.DIAMOND],
          sort: 5,
        },
        {
          name: 'VIP专属活动',
          type: BenefitType.SERVICE,
          description: '参加VIP专属美妆活动',
          icon: '✨',
          value: '优先参与',
          applicableLevels: [MemberLevel.DIAMOND],
          sort: 6,
        },
      ]);
      console.log('✅ 默认权益已创建');
    }
  }

  async findAll(params: any = {}) {
    const query: any = {};
    if (params.enabledOnly) {
      query.enabled = true;
    }
    if (params.level) {
      query.applicableLevels = { $in: [params.level] };
    }
    if (params.type) {
      query.type = params.type;
    }
    return this.benefitModel.find(query).sort({ sort: 1 });
  }

  async findById(id: string) {
    return this.benefitModel.findById(id);
  }

  async create(data: Partial<Benefit>) {
    return this.benefitModel.create(data);
  }

  async update(id: string, data: Partial<Benefit>) {
    return this.benefitModel.findByIdAndUpdate(id, data, { new: true });
  }

  async remove(id: string) {
    return this.benefitModel.findByIdAndDelete(id);
  }
}
