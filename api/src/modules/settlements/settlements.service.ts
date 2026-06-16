import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settlement } from '../../entities/settlement.entity.js';
import { CreateSettlementDto } from './dto/create-settlement.dto.js';
import { UpdateSettlementDto } from './dto/update-settlement.dto.js';
import { ApproveSettlementDto } from './dto/approve-settlement.dto.js';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement)
    private readonly settlementRepo: Repository<Settlement>,
  ) {}

  async create(dto: CreateSettlementDto): Promise<Settlement> {
    const settlement = this.settlementRepo.create({
      ...dto,
      status: 'pending',
    });
    return this.settlementRepo.save(settlement);
  }

  async findAll(): Promise<Settlement[]> {
    return this.settlementRepo.find({ relations: ['contract', 'rule', 'approver'], order: { id: 'ASC' } });
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
}
