import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder } from '../../entities/work-order.entity.js';
import { CreateWorkOrderDto } from './dto/create-work-order.dto.js';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { PaginatedResult } from '../../common/types/paginated-result.type.js';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepo: Repository<WorkOrder>,
  ) {}

  async create(dto: CreateWorkOrderDto): Promise<WorkOrder> {
    const workOrder = this.workOrderRepo.create(dto);
    return this.workOrderRepo.save(workOrder);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<WorkOrder>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.workOrderRepo.findAndCount({
      where,
      relations: ['room', 'user', 'assignedUser'],
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepo.findOne({ where: { id }, relations: ['room', 'user', 'assignedUser'] });
    if (!workOrder) throw new NotFoundException(`WorkOrder #${id} not found`);
    return workOrder;
  }

  async update(id: number, dto: UpdateWorkOrderDto): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    const raw = dto as Record<string, any>;
    Object.assign(workOrder, dto);
    if (raw.status === 'completed') {
      workOrder.completedAt = new Date();
    }
    return this.workOrderRepo.save(workOrder);
  }

  async remove(id: number): Promise<void> {
    const workOrder = await this.findOne(id);
    await this.workOrderRepo.remove(workOrder);
  }

  async followUp(id: number): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    workOrder.followUpCount += 1;
    workOrder.lastFollowUpAt = new Date();
    if (workOrder.status === 'pending') {
      workOrder.status = 'in_progress';
    }
    return this.workOrderRepo.save(workOrder);
  }
}
