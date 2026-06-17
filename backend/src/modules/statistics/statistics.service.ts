import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessingRecord } from '../../entities/processing-record.entity';
import { Appointment } from '../../entities/appointment.entity';
import { Refund } from '../../entities/refund.entity';
import { WaitlistEntry } from '../../entities/waitlist-entry.entity';
import { User } from '../../entities/user.entity';
import { Counselor } from '../../entities/counselor.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(ProcessingRecord)
    private processingRecordsRepository: Repository<ProcessingRecord>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Refund)
    private refundsRepository: Repository<Refund>,
    @InjectRepository(WaitlistEntry)
    private waitlistRepository: Repository<WaitlistEntry>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Counselor)
    private counselorsRepository: Repository<Counselor>,
  ) {}

  async getOverview(startDate?: string, endDate?: string) {
    const appointmentQuery = this.appointmentsRepository.createQueryBuilder('appointment');
    const refundQuery = this.refundsRepository.createQueryBuilder('refund');
    const waitlistQuery = this.waitlistRepository.createQueryBuilder('entry');
    const recordQuery = this.processingRecordsRepository.createQueryBuilder('record');

    if (startDate) {
      appointmentQuery.andWhere('appointment.createdAt >= :startDate', { startDate: `${startDate} 00:00:00` });
      refundQuery.andWhere('refund.createdAt >= :startDate', { startDate: `${startDate} 00:00:00` });
      waitlistQuery.andWhere('entry.createdAt >= :startDate', { startDate: `${startDate} 00:00:00` });
      recordQuery.andWhere('record.createdAt >= :startDate', { startDate: `${startDate} 00:00:00` });
    }
    if (endDate) {
      appointmentQuery.andWhere('appointment.createdAt <= :endDate', { endDate: `${endDate} 23:59:59` });
      refundQuery.andWhere('refund.createdAt <= :endDate', { endDate: `${endDate} 23:59:59` });
      waitlistQuery.andWhere('entry.createdAt <= :endDate', { endDate: `${endDate} 23:59:59` });
      recordQuery.andWhere('record.createdAt <= :endDate', { endDate: `${endDate} 23:59:59` });
    }

    const [totalAppointments, totalRefunds, totalWaitlist, totalRecords] = await Promise.all([
      appointmentQuery.getCount(),
      refundQuery.getCount(),
      waitlistQuery.getCount(),
      recordQuery.getCount(),
    ]);

    const completedQuery = appointmentQuery.clone().andWhere("appointment.status = 'completed'");
    const noShowQuery = appointmentQuery.clone().andWhere("appointment.status = 'no_show'");
    const cancelledQuery = appointmentQuery.clone().andWhere("appointment.status = 'cancelled'");
    const paymentFailedQuery = appointmentQuery.clone().andWhere("appointment.paymentStatus = 'failed'");

    const [completedCount, noShowCount, cancelledCount, paymentFailedCount] = await Promise.all([
      completedQuery.getCount(),
      noShowQuery.getCount(),
      cancelledQuery.getCount(),
      paymentFailedQuery.getCount(),
    ]);

    const noShowRate = totalAppointments > 0 ? ((noShowCount / totalAppointments) * 100).toFixed(2) : '0.00';
    const paymentFailRate = totalAppointments > 0 ? ((paymentFailedCount / totalAppointments) * 100).toFixed(2) : '0.00';
    const completionRate = totalAppointments > 0 ? ((completedCount / totalAppointments) * 100).toFixed(2) : '0.00';

    const refundApprovedCount = await refundQuery.clone()
      .andWhere("refund.status = 'approved'")
      .getCount();

    const pendingRefundCount = await refundQuery.clone()
      .andWhere("refund.status = 'pending'")
      .getCount();

    const waitingWaitlistCount = await waitlistQuery.clone()
      .andWhere("entry.status = 'waiting'")
      .getCount();

    return {
      totalAppointments,
      totalRefunds,
      totalWaitlist,
      totalProcessingRecords: totalRecords,
      completedCount,
      noShowCount,
      cancelledCount,
      paymentFailedCount,
      noShowRate: `${noShowRate}%`,
      paymentFailRate: `${paymentFailRate}%`,
      completionRate: `${completionRate}%`,
      refundApprovedCount,
      pendingRefundCount,
      waitingWaitlistCount,
    };
  }

  async getProcessingRecords(page = 1, pageSize = 10, filters: any = {}) {
    const query = this.processingRecordsRepository.createQueryBuilder('record')
      .leftJoinAndSelect('record.operator', 'operator');

    if (filters.type) {
      query.andWhere('record.type = :type', { type: filters.type });
    }
    if (filters.operatorId) {
      query.andWhere('record.operatorId = :operatorId', { operatorId: filters.operatorId });
    }
    if (filters.relatedType) {
      query.andWhere('record.relatedType = :relatedType', { relatedType: filters.relatedType });
    }
    if (filters.relatedId) {
      query.andWhere('record.relatedId = :relatedId', { relatedId: filters.relatedId });
    }
    if (filters.startDate) {
      query.andWhere('record.createdAt >= :startDate', { startDate: `${filters.startDate} 00:00:00` });
    }
    if (filters.endDate) {
      query.andWhere('record.createdAt <= :endDate', { endDate: `${filters.endDate} 23:59:59` });
    }

    query.orderBy('record.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await query.getManyAndCount();

    return {
      items: items.map(item => ({
        ...item,
        operator: item.operator ? { id: item.operator.id, name: item.operator.name, role: item.operator.role } : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getAppointmentStatsByCounselor(startDate?: string, endDate?: string) {
    const query = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.counselor', 'counselor')
      .select([
        'counselor.id as counselorId',
        'counselor.name as counselorName',
        'COUNT(appointment.id) as total',
        `SUM(CASE WHEN appointment.status = 'completed' THEN 1 ELSE 0 END) as completed`,
        `SUM(CASE WHEN appointment.status = 'no_show' THEN 1 ELSE 0 END) as no_show`,
        `SUM(CASE WHEN appointment.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled`,
        `SUM(CASE WHEN appointment.paymentStatus = 'failed' THEN 1 ELSE 0 END) as payment_failed`,
      ])
      .groupBy('counselor.id, counselor.name')
      .orderBy('total', 'DESC');

    if (startDate) {
      query.andWhere('appointment.createdAt >= :startDate', { startDate: `${startDate} 00:00:00` });
    }
    if (endDate) {
      query.andWhere('appointment.createdAt <= :endDate', { endDate: `${endDate} 23:59:59` });
    }

    const result = await query.getRawMany();

    return result.map(item => ({
      counselorId: item.counselorid,
      counselorName: item.counselorname,
      total: parseInt(item.total),
      completed: parseInt(item.completed),
      noShow: parseInt(item.no_show),
      cancelled: parseInt(item.cancelled),
      paymentFailed: parseInt(item.payment_failed),
      noShowRate: item.total > 0 ? `${((parseInt(item.no_show) / parseInt(item.total)) * 100).toFixed(2)}%` : '0.00%',
    }));
  }

  async getRefundStats(startDate?: string, endDate?: string) {
    const query = this.refundsRepository
      .createQueryBuilder('refund')
      .select([
        'refund.reason as reason',
        'COUNT(refund.id) as count',
        'SUM(refund.refundAmount) as totalAmount',
      ])
      .groupBy('refund.reason');

    if (startDate) {
      query.andWhere('refund.createdAt >= :startDate', { startDate: `${startDate} 00:00:00` });
    }
    if (endDate) {
      query.andWhere('refund.createdAt <= :endDate', { endDate: `${endDate} 23:59:59` });
    }

    return query.getRawMany();
  }

  async getRecentRecords(limit = 20) {
    const records = await this.processingRecordsRepository.find({
      relations: ['operator'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return records.map(item => ({
      ...item,
      operator: item.operator ? { id: item.operator.id, name: item.operator.name, role: item.operator.role } : null,
    }));
  }

  async getWaitlistStats() {
    const result = await this.waitlistRepository
      .createQueryBuilder('entry')
      .leftJoin('entry.counselor', 'counselor')
      .select([
        'counselor.id as counselorId',
        'counselor.name as counselorName',
        'COUNT(entry.id) as total',
        `SUM(CASE WHEN entry.status = 'waiting' THEN 1 ELSE 0 END) as waiting`,
        `SUM(CASE WHEN entry.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed`,
        `SUM(CASE WHEN entry.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled`,
        `SUM(CASE WHEN entry.status = 'expired' THEN 1 ELSE 0 END) as expired`,
      ])
      .groupBy('counselor.id, counselor.name')
      .orderBy('waiting', 'DESC')
      .getRawMany();

    return result.map(item => ({
      counselorId: item.counselorid,
      counselorName: item.counselorname,
      total: parseInt(item.total),
      waiting: parseInt(item.waiting),
      confirmed: parseInt(item.confirmed),
      cancelled: parseInt(item.cancelled),
      expired: parseInt(item.expired),
      conversionRate: item.total > 0 ? `${((parseInt(item.confirmed) / parseInt(item.total)) * 100).toFixed(2)}%` : '0.00%',
    }));
  }

  async getCrossDeptReport(startDate: string, endDate: string) {
    const overview = await this.getOverview(startDate, endDate);
    const counselorStats = await this.getAppointmentStatsByCounselor(startDate, endDate);
    const refundStats = await this.getRefundStats(startDate, endDate);
    const waitlistStats = await this.getWaitlistStats();
    const recentRecords = await this.getRecentRecords(50);

    return {
      period: { startDate, endDate },
      overview,
      counselorStats,
      refundStats,
      waitlistStats,
      recentRecords,
    };
  }
}
