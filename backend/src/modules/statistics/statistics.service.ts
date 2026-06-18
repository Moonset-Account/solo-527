import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus, BadReviewReason } from '../../entities/appointment.entity';
import { FosterRecord, FosterStatus } from '../../entities/foster-record.entity';
import { AdoptionRecord, AdoptionStatus } from '../../entities/adoption-record.entity';
import { Service, ServiceType } from '../../entities/service.entity';
import { Pet, PetSource } from '../../entities/pet.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(FosterRecord)
    private fosterRecordRepository: Repository<FosterRecord>,
    @InjectRepository(AdoptionRecord)
    private adoptionRecordRepository: Repository<AdoptionRecord>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
  ) {}

  private getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getEndOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  async getServiceRepurchaseStatistics(startTime?: Date, endTime?: Date) {
    const qb = this.appointmentRepository
      .createQueryBuilder('apt')
      .leftJoinAndSelect('apt.service', 'service')
      .where('apt.status IN (:...statuses)', {
        statuses: [
          AppointmentStatus.COMPLETED,
          AppointmentStatus.IN_PROGRESS,
          AppointmentStatus.CONFIRMED,
        ],
      });

    if (startTime && endTime) {
      qb.andWhere('apt.createdAt BETWEEN :startTime AND :endTime', {
        startTime,
        endTime,
      });
    }

    const appointments = await qb.getMany();

    const serviceTypeMap = new Map<string, {
      serviceType: ServiceType;
      serviceName: string;
      purchaseCount: number;
      uniqueUsers: Set<string>;
    }>();

    const userServiceCountMap = new Map<string, Map<string, number>>();

    for (const apt of appointments) {
      if (!apt.service) continue;

      const type = apt.service.type;
      const customerId = apt.customerId;

      if (!userServiceCountMap.has(customerId)) {
        userServiceCountMap.set(customerId, new Map());
      }
      const userServiceMap = userServiceCountMap.get(customerId)!;
      userServiceMap.set(type, (userServiceMap.get(type) || 0) + 1);

      if (!serviceTypeMap.has(type)) {
        serviceTypeMap.set(type, {
          serviceType: type,
          serviceName: apt.service.name,
          purchaseCount: 0,
          uniqueUsers: new Set(),
        });
      }

      const stat = serviceTypeMap.get(type)!;
      stat.purchaseCount++;
      stat.uniqueUsers.add(customerId);
    }

    const result = Array.from(serviceTypeMap.values()).map((stat) => {
      let repurchaseUserCount = 0;
      for (const [customerId, serviceMap] of userServiceCountMap.entries()) {
        const count = serviceMap.get(stat.serviceType) || 0;
        if (count >= 2) {
          repurchaseUserCount++;
        }
      }

      return {
        serviceType: stat.serviceType,
        serviceName: stat.serviceName,
        purchaseCount: stat.purchaseCount,
        uniqueUserCount: stat.uniqueUsers.size,
        repurchaseUserCount,
        repurchaseRate:
          stat.uniqueUsers.size > 0
            ? Number(((repurchaseUserCount / stat.uniqueUsers.size) * 100).toFixed(2))
            : 0,
      };
    });

    return {
      totalPurchaseCount: appointments.length,
      startTime,
      endTime,
      data: result,
      statisticalCaliber:
        '复购率=重复购买用户数/总购买用户数，重复购买指同一用户在时间范围内购买同一服务类型2次及以上；统计范围为已完成、进行中、已确认的预约',
    };
  }

  async getFosterSafetyStatistics(startTime?: Date, endTime?: Date) {
    const qb = this.fosterRecordRepository
      .createQueryBuilder('fr')
      .leftJoinAndSelect('fr.volunteer', 'volunteer');

    if (startTime && endTime) {
      qb.andWhere('fr.createdAt BETWEEN :startTime AND :endTime', {
        startTime,
        endTime,
      });
    }

    const fosterRecords = await qb.getMany();

    const volunteerStatsMap = new Map<string, {
      volunteerId: string;
      volunteerName: string;
      totalCount: number;
      completedCount: number;
      activeCount: number;
      cancelledCount: number;
      totalDays: number;
    }>();

    for (const record of fosterRecords) {
      const volunteerId = record.volunteerId;
      if (!volunteerStatsMap.has(volunteerId)) {
        volunteerStatsMap.set(volunteerId, {
          volunteerId,
          volunteerName: record.volunteer?.name || '未知',
          totalCount: 0,
          completedCount: 0,
          activeCount: 0,
          cancelledCount: 0,
          totalDays: 0,
        });
      }

      const stat = volunteerStatsMap.get(volunteerId)!;
      stat.totalCount++;

      if (record.status === FosterStatus.COMPLETED) {
        stat.completedCount++;
        if (record.startDate && record.endDate) {
          const days = Math.ceil(
            (new Date(record.endDate).getTime() - new Date(record.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          stat.totalDays += Math.max(days, 0);
        }
      } else if (record.status === FosterStatus.ACTIVE || record.status === FosterStatus.EXTENDED) {
        stat.activeCount++;
      } else if (record.status === FosterStatus.CANCELLED) {
        stat.cancelledCount++;
      }
    }

    const volunteerStats = Array.from(volunteerStatsMap.values()).map((stat) => ({
      volunteerId: stat.volunteerId,
      volunteerName: stat.volunteerName,
      totalFosterCount: stat.totalCount,
      completedCount: stat.completedCount,
      activeCount: stat.activeCount,
      cancelledCount: stat.cancelledCount,
      completionRate:
        stat.totalCount > 0
          ? Number(((stat.completedCount / stat.totalCount) * 100).toFixed(2))
          : 0,
      averageFosterDays:
        stat.completedCount > 0
          ? Number((stat.totalDays / stat.completedCount).toFixed(2))
          : 0,
    }));

    const dailyStatsMap = new Map<string, number>();
    for (const record of fosterRecords) {
      const dateKey = new Date(record.startDate).toISOString().split('T')[0];
      dailyStatsMap.set(dateKey, (dailyStatsMap.get(dateKey) || 0) + 1);
    }

    const dailyStats = Array.from(dailyStatsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const badReviewQb = this.appointmentRepository
      .createQueryBuilder('apt')
      .where('apt.badReviewReason IS NOT NULL');

    if (startTime && endTime) {
      badReviewQb.andWhere('apt.createdAt BETWEEN :startTime AND :endTime', {
        startTime,
        endTime,
      });
    }

    const badReviewAppointments = await badReviewQb.getMany();

    const badReviewReasonMap = new Map<BadReviewReason, number>();
    for (const reason of Object.values(BadReviewReason)) {
      badReviewReasonMap.set(reason, 0);
    }
    for (const apt of badReviewAppointments) {
      if (apt.badReviewReason) {
        badReviewReasonMap.set(
          apt.badReviewReason,
          (badReviewReasonMap.get(apt.badReviewReason) || 0) + 1,
        );
      }
    }

    const totalBadReviews = badReviewAppointments.length;
    const badReviewDistribution = Array.from(badReviewReasonMap.entries()).map(
      ([reason, count]) => ({
        reason,
        count,
        percentage:
          totalBadReviews > 0
            ? Number(((count / totalBadReviews) * 100).toFixed(2))
            : 0,
      }),
    );

    return {
      startTime,
      endTime,
      volunteerStats,
      dailyFosterStats: dailyStats,
      badReviewDistribution,
      statisticalCaliber:
        '寄养完成率=已完成寄养数/总寄养数；平均寄养天数=已完成寄养的总寄养天数/已完成寄养数；差评分布基于预约记录中badReviewReason字段统计',
    };
  }

  async getAppointmentOverview(startTime?: Date, endTime?: Date) {
    const qb = this.appointmentRepository.createQueryBuilder('apt');

    if (startTime && endTime) {
      qb.andWhere('apt.createdAt BETWEEN :startTime AND :endTime', {
        startTime,
        endTime,
      });
    }

    const appointments = await qb.getMany();

    const statusCountMap = new Map<AppointmentStatus, number>();
    for (const status of Object.values(AppointmentStatus)) {
      statusCountMap.set(status, 0);
    }
    for (const apt of appointments) {
      statusCountMap.set(apt.status, (statusCountMap.get(apt.status) || 0) + 1);
    }

    const statusStats = Array.from(statusCountMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    const today = new Date();
    const todayStart = this.getStartOfDay(today);
    const todayEnd = this.getEndOfDay(today);
    const todayAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= todayStart && aptDate <= todayEnd;
    });

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const weekAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= weekStart && aptDate <= weekEnd;
    });

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthRevenue = appointments
      .filter((apt) => {
        const aptDate = new Date(apt.createdAt);
        return (
          aptDate >= monthStart &&
          aptDate <= monthEnd &&
          apt.status === AppointmentStatus.COMPLETED
        );
      })
      .reduce((sum, apt) => sum + Number(apt.totalPrice || 0), 0);

    const totalRevenue = appointments
      .filter((apt) => apt.status === AppointmentStatus.COMPLETED)
      .reduce((sum, apt) => sum + Number(apt.totalPrice || 0), 0);

    return {
      startTime,
      endTime,
      totalCount: appointments.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      statusStats,
      todayAppointmentCount: todayAppointments.length,
      weekAppointmentCount: weekAppointments.length,
      monthRevenue: Number(monthRevenue.toFixed(2)),
      statisticalCaliber:
        '今日预约指预约开始时间在今日00:00-23:59的预约；本周预约指预约开始时间在本周日至周六的预约；本月营收为本月内已完成预约的总金额；总营收为时间范围内已完成预约的总金额',
    };
  }

  async getAdoptionOverview(startTime?: Date, endTime?: Date) {
    const qb = this.adoptionRecordRepository
      .createQueryBuilder('ar')
      .leftJoinAndSelect('ar.pet', 'pet');

    if (startTime && endTime) {
      qb.andWhere('ar.createdAt BETWEEN :startTime AND :endTime', {
        startTime,
        endTime,
      });
    }

    const adoptionRecords = await qb.getMany();

    const statusCountMap = new Map<AdoptionStatus, number>();
    for (const status of Object.values(AdoptionStatus)) {
      statusCountMap.set(status, 0);
    }
    for (const record of adoptionRecords) {
      statusCountMap.set(record.status, (statusCountMap.get(record.status) || 0) + 1);
    }

    const statusStats = Array.from(statusCountMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    const sourceCountMap = new Map<PetSource, number>();
    for (const source of Object.values(PetSource)) {
      sourceCountMap.set(source, 0);
    }
    for (const record of adoptionRecords) {
      if (record.pet?.source) {
        sourceCountMap.set(record.pet.source, (sourceCountMap.get(record.pet.source) || 0) + 1);
      }
    }

    const sourceStats = Array.from(sourceCountMap.entries()).map(([source, count]) => ({
      source,
      count,
    }));

    return {
      startTime,
      endTime,
      totalCount: adoptionRecords.length,
      statusStats,
      sourceStats,
      statisticalCaliber:
        '领养状态统计基于领养记录的status字段；来源统计基于领养记录关联宠物的source字段',
    };
  }
}
