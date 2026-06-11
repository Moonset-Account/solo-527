import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AfterSaleOrder } from './after-sale.entity.js';
import { CreateAfterSaleDto, UpdateAfterSaleDto, AfterSaleFilterDto } from './dto.js';

@Injectable()
export class AfterSaleService {
  constructor(
    @InjectRepository(AfterSaleOrder)
    private orderRepo: Repository<AfterSaleOrder>,
  ) {}

  async findAll(filters: AfterSaleFilterDto) {
    const qb = this.orderRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.project', 'project')
      .leftJoinAndSelect('o.customer', 'customer')
      .leftJoinAndSelect('o.assignee', 'assignee');

    if (filters.status) qb.andWhere('o.status = :status', { status: filters.status });
    if (filters.projectId) qb.andWhere('o.project_id = :projectId', { projectId: filters.projectId });
    if (filters.startDate) qb.andWhere('o.created_at >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('o.created_at <= :endDate', { endDate: filters.endDate });

    return qb.orderBy('o.created_at', 'DESC').getMany();
  }

  async create(dto: CreateAfterSaleDto) {
    const order = this.orderRepo.create(dto);
    return this.orderRepo.save(order);
  }

  async update(id: string, dto: UpdateAfterSaleDto) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    Object.assign(order, dto);
    return this.orderRepo.save(order);
  }

  async assign(id: string, assignedTo: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    order.assignedTo = assignedTo;
    order.status = 'assigned';
    return this.orderRepo.save(order);
  }

  async close(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    order.status = 'closed';
    order.closedAt = new Date();
    return this.orderRepo.save(order);
  }

  async findAllForExport(filters: AfterSaleFilterDto) {
    return this.findAll(filters);
  }
}
