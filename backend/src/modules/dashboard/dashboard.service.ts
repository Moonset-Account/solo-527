import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';
import { Demand } from '../../entities/demand.entity';
import { Quote } from '../../entities/quote.entity';
import { Contract } from '../../entities/contract.entity';
import { Supplier } from '../../entities/supplier.entity';
import { User } from '../../entities/user.entity';
import dayjs from 'dayjs';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Demand)
    private demandRepository: Repository<Demand>,
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getOverview(query: any) {
    const { startDate, endDate, assigneeId } = query;
    const now = new Date();

    const demandWhere: any = {};
    if (startDate && endDate) {
      demandWhere.createdAt = Between(new Date(startDate), new Date(endDate));
    }
    if (assigneeId) {
      demandWhere.assigneeId = assigneeId;
    }

    const totalDemands = await this.demandRepository.count({ where: demandWhere });
    const pendingDemands = await this.demandRepository.count({ where: { ...demandWhere, status: 'pending' } });
    const quotingDemands = await this.demandRepository.count({ where: { ...demandWhere, status: 'quoting' } });
    const confirmedDemands = await this.demandRepository.count({ where: { ...demandWhere, status: 'confirmed' } });

    const quoteWhere: any = {};
    if (assigneeId) {
      quoteWhere.createdById = assigneeId;
    }
    const totalQuotes = await this.quoteRepository.count({ where: quoteWhere });
    const pendingApprovalQuotes = await this.quoteRepository.count({ where: { ...quoteWhere, status: 'pending_approval' } });
    const approvedQuotes = await this.quoteRepository.count({ where: { ...quoteWhere, status: 'approved' } });

    const totalContracts = await this.contractRepository.count();
    const pendingContracts = await this.contractRepository.count({ where: { status: 'pending' } });

    const overdueTasks = await this.demandRepository.find({
      where: {
        status: 'quoting',
        travelStart: LessThan(now),
      },
      relations: ['assignee'],
      take: 10,
    });

    const recentActivities = [];

    return {
      stats: {
        totalDemands,
        pendingDemands,
        quotingDemands,
        confirmedDemands,
        totalQuotes,
        pendingApprovalQuotes,
        approvedQuotes,
        totalContracts,
        pendingContracts,
      },
      overdueTasks,
      recentActivities,
    };
  }

  async getOverdueTasks(query: any) {
    const { page = 1, pageSize = 20, assigneeId } = query;
    const now = new Date();

    const where: any = {
      travelStart: LessThan(now),
      status: 'quoting',
    };
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    const [data, total] = await this.demandRepository.findAndCount({
      where,
      relations: ['assignee'],
      order: { travelStart: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async getResourceUtilization() {
    const users = await this.userRepository.find({
      where: { role: 'product' },
    });

    const now = dayjs();
    const startOfMonth = now.startOf('month').toDate();
    const endOfMonth = now.endOf('month').toDate();

    const utilization = [];

    for (const user of users) {
      const assignedCount = await this.demandRepository.count({
        where: {
          assigneeId: user.id,
          createdAt: Between(startOfMonth, endOfMonth),
        },
      });

      const completedCount = await this.demandRepository.count({
        where: {
          assigneeId: user.id,
          status: 'confirmed',
          updatedAt: Between(startOfMonth, endOfMonth),
        },
      });

      utilization.push({
        userId: user.id,
        userName: user.name,
        assignedCount,
        completedCount,
        utilizationRate: assignedCount > 0 ? (completedCount / assignedCount) * 100 : 0,
      });
    }

    return utilization;
  }

  async getProcessStuck() {
    const stuckDemands = await this.demandRepository
      .createQueryBuilder('demand')
      .where('demand.status = :status', { status: 'quoting' })
      .andWhere("demand.updated_at < NOW() - INTERVAL '3 days'")
      .leftJoinAndSelect('demand.assignee', 'assignee')
      .getMany();

    const stuckQuotes = await this.quoteRepository
      .createQueryBuilder('quote')
      .where('quote.status = :status', { status: 'pending_approval' })
      .andWhere("quote.created_at < NOW() - INTERVAL '2 days'")
      .leftJoinAndSelect('quote.createdBy', 'createdBy')
      .getMany();

    return {
      stuckDemands,
      stuckQuotes,
    };
  }
}
