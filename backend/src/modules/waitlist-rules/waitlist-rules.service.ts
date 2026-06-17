import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaitlistRule } from '../../entities/waitlist-rule.entity';

@Injectable()
export class WaitlistRulesService {
  constructor(
    @InjectRepository(WaitlistRule)
    private rulesRepository: Repository<WaitlistRule>,
  ) {}

  async create(createRuleDto: any) {
    const rule = this.rulesRepository.create(createRuleDto);
    return this.rulesRepository.save(rule);
  }

  async findAll(page = 1, pageSize = 10, isActive?: boolean) {
    const query = this.rulesRepository.createQueryBuilder('rule');

    if (isActive !== undefined) {
      query.andWhere('rule.isActive = :isActive', { isActive });
    }

    query.orderBy('rule.priority', 'DESC')
      .addOrderBy('rule.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const rule = await this.rulesRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('规则不存在');
    }
    return rule;
  }

  async update(id: string, updateRuleDto: any) {
    const rule = await this.findOne(id);
    if (!rule) {
      throw new NotFoundException('规则不存在');
    }
    await this.rulesRepository.update(id, updateRuleDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.rulesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('规则不存在');
    }
    return { success: true };
  }

  async toggleActive(id: string) {
    const rule = await this.findOne(id);
    await this.rulesRepository.update(id, { isActive: !rule.isActive });
    return this.findOne(id);
  }

  async getActiveRules() {
    return this.rulesRepository.find({
      where: { isActive: true },
      order: { priority: 'DESC' },
    });
  }

  async getApplicableRule(counselorId?: string) {
    const activeRules = await this.rulesRepository.find({
      where: { isActive: true },
      order: { priority: 'DESC' },
    });

    if (counselorId) {
      const counselorRule = activeRules.find(
        (rule) => rule.counselorId === counselorId
      );
      if (counselorRule) {
        return counselorRule;
      }
    }

    const globalRule = activeRules.find((rule) => !rule.counselorId);
    if (globalRule) {
      return globalRule;
    }

    return {
      id: 'default',
      ruleName: '系统默认规则',
      ruleType: 'time_window' as const,
      notificationWindowMinutes: 30,
      responseTimeoutMinutes: 15,
      maxQueueSize: 10,
      priority: 0,
      isActive: true,
    };
  }
}
