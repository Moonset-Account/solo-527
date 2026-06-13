import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, Between } from 'typeorm';
import { AfterSaleOrder } from './after-sale.entity.js';
import { CreateAfterSaleDto, UpdateAfterSaleDto, AfterSaleFilterDto } from './dto.js';

export interface MonthlyBreakdown {
  month: string;
  totalOrders: number;
  closedOrders: number;
  closureRate: number;
  avgResolutionDays: number;
}

export interface AfterSaleReport {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  closedOrders: number;
  closureRate: number;
  avgResolutionDays: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

@Injectable()
export class AfterSaleService {
  constructor(
    @InjectRepository(AfterSaleOrder)
    private orderRepo: Repository<AfterSaleOrder>,
  ) {}

  async findAll(filters: AfterSaleFilterDto, companyId?: string) {
    const qb = this.orderRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.project', 'project');

    if (filters.status) qb.andWhere('o.status = :status', { status: filters.status });
    if (filters.projectId) qb.andWhere('o.project_id = :projectId', { projectId: filters.projectId });
    if (filters.startDate) qb.andWhere('o.created_at >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('o.created_at <= :endDate', { endDate: filters.endDate });
    if (companyId) qb.andWhere('project.company_id = :companyId', { companyId });

    return qb.orderBy('o.created_at', 'DESC').getMany();
  }

  async create(dto: CreateAfterSaleDto) {
    const order = this.orderRepo.create({
      ...dto,
      status: dto.status || 'pending',
    });
    return this.orderRepo.save(order);
  }

  async update(id: string, dto: UpdateAfterSaleDto) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    Object.assign(order, dto);
    return this.orderRepo.save(order);
  }

  async assign(id: string, assigneeId: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    order.assigneeId = assigneeId;
    order.status = 'processing';
    return this.orderRepo.save(order);
  }

  async close(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    order.status = 'closed';
    order.closedAt = new Date();
    if (!order.resolvedAt) order.resolvedAt = new Date();
    return this.orderRepo.save(order);
  }

  async getReport(period: string = 'month'): Promise<AfterSaleReport> {
    const allOrders = await this.orderRepo.find({
      order: { createdAt: 'ASC' },
    });

    const pending = allOrders.filter(o => o.status === 'pending').length;
    const processing = allOrders.filter(o => o.status === 'processing').length;
    const closed = allOrders.filter(o => o.status === 'closed').length;
    const total = allOrders.length;
    const closureRate = total > 0 ? closed / total : 0;

    const closedWithDates = allOrders.filter(o => o.status === 'closed' && o.closedAt);
    const avgDays = closedWithDates.length > 0
      ? closedWithDates.reduce((sum, o) => {
          const diff = new Date(o.closedAt!).getTime() - new Date(o.createdAt).getTime();
          return sum + (diff / (1000 * 60 * 60 * 24));
        }, 0) / closedWithDates.length
      : 0;

    const monthlyMap = new Map<string, { total: number; closed: number; days: number }>();
    for (const order of allOrders) {
      const month = new Date(order.createdAt).toISOString().slice(0, 7);
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { total: 0, closed: 0, days: 0 });
      }
      const m = monthlyMap.get(month)!;
      m.total++;
      if (order.status === 'closed') {
        m.closed++;
        if (order.closedAt) {
          const diff = new Date(order.closedAt).getTime() - new Date(order.createdAt).getTime();
          m.days += diff / (1000 * 60 * 60 * 24);
        }
      }
    }

    const monthlyBreakdown: MonthlyBreakdown[] = [];
    const sortedMonths = Array.from(monthlyMap.keys()).sort();
    for (const month of sortedMonths.slice(-6)) {
      const m = monthlyMap.get(month)!;
      monthlyBreakdown.push({
        month,
        totalOrders: m.total,
        closedOrders: m.closed,
        closureRate: m.total > 0 ? m.closed / m.total : 0,
        avgResolutionDays: m.closed > 0 ? m.days / m.closed : 0,
      });
    }

    return {
      totalOrders: total,
      pendingOrders: pending,
      processingOrders: processing,
      closedOrders: closed,
      closureRate,
      avgResolutionDays: avgDays,
      monthlyBreakdown,
    };
  }

  async findAllForExport(filters: AfterSaleFilterDto, companyId?: string) {
    return this.findAll(filters, companyId);
  }
}
