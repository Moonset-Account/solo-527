import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Counselor } from '../modules/counselors/counselor.entity';
import { Package } from '../modules/packages/package.entity';
import { RefundRuleType } from '../common/enums/refund-rule-type.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Counselor)
    private counselorRepository: Repository<Counselor>,
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
  ) {}

  async onModuleInit() {
    await this.seedCounselors();
    await this.seedPackages();
  }

  private async seedCounselors() {
    const count = await this.counselorRepository.count();
    if (count > 0) return;

    const counselors = [
      {
        name: '张医生',
        title: '主任医师',
        description: '从事心理咨询工作15年，擅长焦虑症、抑郁症的认知行为治疗。',
        specialties: ['焦虑症', '抑郁症', '睡眠障碍'],
        yearsOfExperience: 15,
        isActive: true,
        avatar: '',
      },
      {
        name: '李医生',
        title: '副主任医师',
        description: '专注于青少年心理问题和家庭治疗，有丰富的临床经验。',
        specialties: ['青少年心理', '家庭治疗', '情绪管理'],
        yearsOfExperience: 10,
        isActive: true,
        avatar: '',
      },
      {
        name: '王医生',
        title: '主治医师',
        description: '擅长职场压力管理和人际关系咨询，帮助来访者重建自信。',
        specialties: ['职场压力', '人际关系', '自信心提升'],
        yearsOfExperience: 8,
        isActive: true,
        avatar: '',
      },
      {
        name: '陈医生',
        title: '心理治疗师',
        description: '专注于婚姻情感咨询和个人成长，采用人本主义治疗方法。',
        specialties: ['婚姻情感', '个人成长', '创伤修复'],
        yearsOfExperience: 12,
        isActive: true,
        avatar: '',
      },
    ];

    await this.counselorRepository.save(counselors);
    console.log('咨询师数据初始化完成');
  }

  private async seedPackages() {
    const count = await this.packageRepository.count();
    if (count > 0) return;

    const packages = [
      {
        name: '初次体验套餐',
        description: '适合初次咨询的来访者，包含50分钟面对面咨询。',
        price: 299,
        durationMinutes: 50,
        sessionCount: 1,
        refundRuleType: RefundRuleType.FULL_REFUND,
        refundDeadlineHours: 24,
        refundPercentage: 100,
        refundNotes: '咨询前24小时可全额退款',
        isActive: true,
        sortOrder: 1,
      },
      {
        name: '标准咨询套餐',
        description: '标准50分钟心理咨询，适合常规心理问题咨询。',
        price: 499,
        durationMinutes: 50,
        sessionCount: 1,
        refundRuleType: RefundRuleType.PARTIAL_REFUND,
        refundDeadlineHours: 12,
        refundPercentage: 50,
        refundNotes: '咨询前12小时取消退款50%',
        isActive: true,
        sortOrder: 2,
      },
      {
        name: '深度治疗套餐',
        description: '90分钟深度治疗，适合需要深入探讨的复杂问题。',
        price: 799,
        durationMinutes: 90,
        sessionCount: 1,
        refundRuleType: RefundRuleType.PARTIAL_REFUND,
        refundDeadlineHours: 24,
        refundPercentage: 70,
        refundNotes: '咨询前24小时取消退款70%',
        isActive: true,
        sortOrder: 3,
      },
      {
        name: '疗程套餐（10次）',
        description: '10次咨询疗程，适合需要持续治疗的来访者，享优惠价格。',
        price: 4500,
        durationMinutes: 50,
        sessionCount: 10,
        refundRuleType: RefundRuleType.PARTIAL_REFUND,
        refundDeadlineHours: 48,
        refundPercentage: 80,
        refundNotes: '未使用的次数按比例退款，已使用次数按原价扣除',
        isActive: true,
        sortOrder: 4,
      },
      {
        name: '家庭咨询套餐',
        description: '90分钟家庭或伴侣咨询，改善家庭关系和沟通模式。',
        price: 999,
        durationMinutes: 90,
        sessionCount: 1,
        refundRuleType: RefundRuleType.PARTIAL_REFUND,
        refundDeadlineHours: 24,
        refundPercentage: 60,
        refundNotes: '咨询前24小时取消退款60%',
        isActive: true,
        sortOrder: 5,
      },
    ];

    await this.packageRepository.save(packages);
    console.log('套餐数据初始化完成');
  }
}
