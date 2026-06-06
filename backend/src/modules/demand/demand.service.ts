import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Demand } from '../../entities/demand.entity';
import { User } from '../../entities/user.entity';

interface CreateDemandDto {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  travelStart: Date;
  travelEnd: Date;
  days: number;
  peopleCount: number;
  adultCount?: number;
  childCount?: number;
  destinations?: string;
  specialRequirements?: string;
  assigneeId?: string;
}

interface UpdateDemandDto extends Partial<CreateDemandDto> {
  status?: string;
}

interface DemandQuery {
  status?: string;
  assigneeId?: string;
  startDate?: Date;
  endDate?: Date;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class DemandService {
  constructor(
    @InjectRepository(Demand)
    private demandRepository: Repository<Demand>,
  ) {}

  async findAll(query: DemandQuery) {
    const { status, assigneeId, startDate, endDate, keyword, page = 1, pageSize = 20 } = query;
    const where: any = {};

    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (startDate && endDate) where.travelStart = Between(startDate, endDate);
    if (keyword) where.customerName = Like(`%${keyword}%`);

    const [data, total] = await this.demandRepository.findAndCount({
      where,
      relations: ['assignee'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const demand = await this.demandRepository.findOne({
      where: { id },
      relations: ['assignee', 'quotes'],
    });
    if (!demand) {
      throw new NotFoundException('需求不存在');
    }
    return demand;
  }

  async create(dto: CreateDemandDto, user: User) {
    const demand = this.demandRepository.create({
      ...dto,
      status: 'pending',
      assigneeId: dto.assigneeId || user.id,
    });
    return this.demandRepository.save(demand);
  }

  async update(id: string, dto: UpdateDemandDto) {
    const demand = await this.findOne(id);
    Object.assign(demand, dto);
    return this.demandRepository.save(demand);
  }

  async remove(id: string) {
    const demand = await this.findOne(id);
    return this.demandRepository.remove(demand);
  }
}
