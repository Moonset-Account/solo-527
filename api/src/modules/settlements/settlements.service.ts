import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settlement } from '../../entities/settlement.entity.js';
import { SettlementRule } from '../../entities/settlement-rule.entity.js';
import { CreateSettlementDto } from './dto/create-settlement.dto.js';
import { UpdateSettlementDto } from './dto/update-settlement.dto.js';
import { ApproveSettlementDto } from './dto/approve-settlement.dto.js';
import { CreateSettlementRuleDto } from './dto/create-settlement-rule.dto.js';
import { UpdateSettlementRuleDto } from './dto/update-settlement-rule.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { PaginatedResult } from '../../common/types/paginated-result.type.js';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement)
    private readonly settlementRepo: Repository<Settlement>,
    @InjectRepository(SettlementRule)
    private readonly ruleRepo: Repository<SettlementRule>,
  ) {}

  async create(dto: CreateSettlementDto): Promise<Settlement> {
    const settlement = this.settlementRepo.create({
      ...dto,
      status: 'pending',
    });
    return this.settlementRepo.save(settlement);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Settlement>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.settlementRepo.findAndCount({
      where,
      relations: ['contract', 'rule', 'approver'],
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Settlement> {
    const settlement = await this.settlementRepo.findOne({ where: { id }, relations: ['contract', 'rule', 'approver'] });
    if (!settlement) throw new NotFoundException(`Settlement #${id} not found`);
    return settlement;
  }

  async update(id: number, dto: UpdateSettlementDto): Promise<Settlement> {
    const settlement = await this.findOne(id);
    Object.assign(settlement, dto);
    return this.settlementRepo.save(settlement);
  }

  async remove(id: number): Promise<void> {
    const settlement = await this.findOne(id);
    await this.settlementRepo.remove(settlement);
  }

  async approve(id: number, dto: ApproveSettlementDto): Promise<Settlement> {
    const settlement = await this.findOne(id);
    if (settlement.status !== 'pending') {
      throw new BadRequestException(`Settlement must be in pending status to approve, current: ${settlement.status}`);
    }
    settlement.status = 'approved';
    settlement.approvedBy = dto.approvedBy;
    settlement.approvedAt = new Date();
    return this.settlementRepo.save(settlement);
  }

  async findAllRules(query: PaginationQueryDto): Promise<PaginatedResult<SettlementRule>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.isActive = query.status === 'active' ? true : false;
    }

    const [data, total] = await this.ruleRepo.findAndCount({
      where,
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOneRule(id: number): Promise<SettlementRule> {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException(`SettlementRule #${id} not found`);
    return rule;
  }

  async createRule(dto: CreateSettlementRuleDto): Promise<SettlementRule> {
    const rule = this.ruleRepo.create(dto);
    return this.ruleRepo.save(rule);
  }

  async updateRule(id: number, dto: UpdateSettlementRuleDto): Promise<SettlementRule> {
    const rule = await this.findOneRule(id);
    Object.assign(rule, dto);
    return this.ruleRepo.save(rule);
  }

  async removeRule(id: number): Promise<void> {
    const rule = await this.findOneRule(id);
    await this.ruleRepo.remove(rule);
  }
}
