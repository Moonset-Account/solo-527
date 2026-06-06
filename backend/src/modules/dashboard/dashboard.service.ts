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
    const { startDate, endDate, assigneeId, status, quoteStatus } = query;
    const now = new Date();

    const demandWhere: any = {};
    if (startDate && endDate) {
      demandWhere.createdAt = Between(new Date(startDate), new Date(endDate));
    }
    if (assigneeId) {
      demandWhere.assigneeId = assigneeId;
    }
    if (status) {
      demandWhere.status = status;
    }

    const totalDemands = await this.demandRepository.count({ where: demandWhere });
    const pendingDemands = await this.demandRepository.count({ where: { ...demandWhere, status: 'pending' } });
    const quotingDemands = await this.demandRepository.count({ where: { ...demandWhere, status: 'quoting' } });
    const confirmedDemands = await this.demandRepository.count({ where: { ...demandWhere, status: 'confirmed' } });

    const quoteWhere: any = {};
    if (startDate && endDate) {
      quoteWhere.createdAt = Between(new Date(startDate), new Date(endDate));
    }
    if (assigneeId) {
      quoteWhere.createdById = assigneeId;
    }
    if (quoteStatus) {
      quoteWhere.status = quoteStatus;
    }
    const totalQuotes = await this.quoteRepository.count({ where: quoteWhere });
    const pendingApprovalQuotes = await this.quoteRepository.count({ where: { ...quoteWhere, status: 'pending_approval' } });
    const approvedQuotes = await this.quoteRepository.count({ where: { ...quoteWhere, status: 'approved' } });

    const contractWhere: any = {};
    if (startDate && endDate) {
      contractWhere.createdAt = Between(new Date(startDate), new Date(endDate));
    }
    const totalContracts = await this.contractRepository.count({ where: contractWhere });
    const pendingContracts = await this.contractRepository.count({ where: { ...contractWhere, status: 'pending' } });

    const overdueWhere: any = {
      status: 'quoting',
      travelStart: LessThan(now),
    };
    if (assigneeId) {
      overdueWhere.assigneeId = assigneeId;
    }
    const overdueTasks = await this.demandRepository.find({
      where: overdueWhere,
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

  async getResourceUtilization(query: any = {}) {
    const { startDate, endDate, assigneeId, status } = query;

    const userWhere: any = { role: 'product' };
    if (assigneeId) {
      userWhere.id = assigneeId;
    }
    const users = await this.userRepository.find({ where: userWhere });

    let startOfRange: Date;
    let endOfRange: Date;

    if (startDate && endDate) {
      startOfRange = new Date(startDate);
      endOfRange = new Date(endDate);
    } else {
      const now = dayjs();
      startOfRange = now.startOf('month').toDate();
      endOfRange = now.endOf('month').toDate();
    }

    const utilization = [];

    for (const user of users) {
      const assignedWhere: any = {
        assigneeId: user.id,
        createdAt: Between(startOfRange, endOfRange),
      };
      if (status) {
        assignedWhere.status = status;
      }
      const assignedCount = await this.demandRepository.count({ where: assignedWhere });

      const completedWhere: any = {
        assigneeId: user.id,
        status: 'confirmed',
        updatedAt: Between(startOfRange, endOfRange),
      };
      const completedCount = await this.demandRepository.count({ where: completedWhere });

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

  async getProcessStuck(query: any = {}) {
    const { startDate, endDate, assigneeId, status, createdById } = query;

    const demandQuery = this.demandRepository
      .createQueryBuilder('demand')
      .where('demand.status = :status', { status: status || 'quoting' })
      .andWhere("demand.updated_at < NOW() - INTERVAL '3 days'")
      .leftJoinAndSelect('demand.assignee', 'assignee');

    if (startDate && endDate) {
      demandQuery.andWhere('demand.created_at BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate),
      });
    }
    if (assigneeId) {
      demandQuery.andWhere('demand.assignee_id = :assigneeId', { assigneeId });
    }

    const stuckDemands = await demandQuery.getMany();

    const quoteQuery = this.quoteRepository
      .createQueryBuilder('quote')
      .where('quote.status = :status', { status: 'pending_approval' })
      .andWhere("quote.created_at < NOW() - INTERVAL '2 days'")
      .leftJoinAndSelect('quote.createdBy', 'createdBy');

    if (startDate && endDate) {
      quoteQuery.andWhere('quote.created_at BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate),
      });
    }
    if (createdById) {
      quoteQuery.andWhere('quote.created_by_id = :createdById', { createdById });
    }

    const stuckQuotes = await quoteQuery.getMany();

    return {
      stuckDemands,
      stuckQuotes,
    };
  }
}
