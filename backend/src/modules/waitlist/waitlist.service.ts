import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaitlistEntry } from '../../entities/waitlist-entry.entity';
import { Appointment } from '../../entities/appointment.entity';
import { ProcessingRecord } from '../../entities/processing-record.entity';
import { Schedule } from '../../entities/schedule.entity';
import { WaitlistRulesService } from '../waitlist-rules/waitlist-rules.service';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectRepository(WaitlistEntry)
    private waitlistRepository: Repository<WaitlistEntry>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(ProcessingRecord)
    private processingRecordsRepository: Repository<ProcessingRecord>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    private waitlistRulesService: WaitlistRulesService,
  ) {}

  async joinWaitlist(joinDto: any, userId: string) {
    const { counselorId, serviceId, preferredDate, preferredStartTime, preferredEndTime, visitReason } = joinDto;

    const rule = await this.waitlistRulesService.getApplicableRule(counselorId);

    const activeCount = await this.waitlistRepository
      .createQueryBuilder('entry')
      .where('entry.counselorId = :counselorId', { counselorId })
      .andWhere('entry.preferredDate = :preferredDate', { preferredDate })
      .andWhere('entry.status IN (:...statuses)', { statuses: ['waiting', 'notified'] })
      .getCount();

    if (activeCount >= rule.maxQueueSize) {
      throw new BadRequestException(
        `候补队列已满（最多${rule.maxQueueSize}人），请选择其他日期或咨询师`
      );
    }

    const existingEntry = await this.waitlistRepository.findOne({
      where: {
        clientId: userId,
        counselorId,
        preferredDate,
        status: 'waiting',
      },
    });
    if (existingEntry) {
      throw new BadRequestException('您已在该日期的候补队列中，请勿重复加入');
    }

    const maxPosition = await this.waitlistRepository
      .createQueryBuilder('entry')
      .select('MAX(entry.queuePosition)', 'maxPos')
      .where('entry.counselorId = :counselorId', { counselorId })
      .andWhere('entry.preferredDate = :preferredDate', { preferredDate })
      .andWhere('entry.status IN (:...statuses)', { statuses: ['waiting', 'notified'] })
      .getRawOne();

    const queuePosition = (maxPosition?.maxPos || 0) + 1;

    const entry = this.waitlistRepository.create({
      clientId: userId,
      counselorId,
      serviceId,
      preferredDate,
      preferredStartTime,
      preferredEndTime,
      visitReason,
      queuePosition,
      status: 'waiting',
    });

    const saved = await this.waitlistRepository.save(entry) as unknown as WaitlistEntry;

    await this.processingRecordsRepository.save({
      type: 'waitlist_add',
      relatedId: saved.id,
      relatedType: 'waitlist',
      operatorId: userId,
      action: '加入候补队列',
      remarks: `队列位置: ${queuePosition}，适用规则: ${rule.ruleName}`,
    });

    return {
      ...saved,
      applicableRule: {
        ruleName: rule.ruleName,
        maxQueueSize: rule.maxQueueSize,
        notificationWindowMinutes: rule.notificationWindowMinutes,
        responseTimeoutMinutes: rule.responseTimeoutMinutes,
      },
    };
  }

  async findAll(page = 1, pageSize = 10, filters: any = {}) {
    const query = this.waitlistRepository.createQueryBuilder('entry')
      .leftJoinAndSelect('entry.client', 'client')
      .leftJoinAndSelect('entry.counselor', 'counselor')
      .leftJoinAndSelect('entry.service', 'service');

    if (filters.status) {
      query.andWhere('entry.status = :status', { status: filters.status });
    }
    if (filters.counselorId) {
      query.andWhere('entry.counselorId = :counselorId', { counselorId: filters.counselorId });
    }
    if (filters.clientId) {
      query.andWhere('entry.clientId = :clientId', { clientId: filters.clientId });
    }
    if (filters.preferredDate) {
      query.andWhere('entry.preferredDate = :preferredDate', { preferredDate: filters.preferredDate });
    }

    query.orderBy('entry.queuePosition', 'ASC')
      .addOrderBy('entry.createdAt', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await query.getManyAndCount();

    return {
      items: items.map(item => ({
        ...item,
        client: item.client ? { id: item.client.id, name: item.client.name, phone: item.client.phone } : null,
        counselor: item.counselor ? { id: item.counselor.id, name: item.counselor.name } : null,
        service: item.service ? { id: item.service.id, name: item.service.name } : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findByClient(clientId: string, page = 1, pageSize = 10) {
    const [items, total] = await this.waitlistRepository.findAndCount({
      where: { clientId },
      relations: ['counselor', 'service'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: items.map(item => ({
        ...item,
        counselor: item.counselor ? { id: item.counselor.id, name: item.counselor.name } : null,
        service: item.service ? { id: item.service.id, name: item.service.name } : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const entry = await this.waitlistRepository.findOne({
      where: { id },
      relations: ['client', 'counselor', 'service'],
    });
    if (!entry) {
      throw new NotFoundException('候补记录不存在');
    }

    const rule = await this.waitlistRulesService.getApplicableRule(entry.counselorId);

    return {
      ...entry,
      client: entry.client ? { id: entry.client.id, name: entry.client.name, phone: entry.client.phone } : null,
      counselor: entry.counselor ? { id: entry.counselor.id, name: entry.counselor.name } : null,
      service: entry.service ? { id: entry.service.id, name: entry.service.name } : null,
      applicableRule: {
        ruleName: rule.ruleName,
        maxQueueSize: rule.maxQueueSize,
        notificationWindowMinutes: rule.notificationWindowMinutes,
        responseTimeoutMinutes: rule.responseTimeoutMinutes,
      },
      canConfirm: entry.status === 'notified' ? this._checkCanConfirm(entry, rule) : null,
      expiresAt: entry.status === 'notified' ? this._getExpireTime(entry, rule) : null,
    };
  }

  private _getExpireTime(entry: WaitlistEntry, rule: any): Date | null {
    if (!entry.notifiedAt) return null;
    const expireTime = new Date(entry.notifiedAt);
    expireTime.setMinutes(expireTime.getMinutes() + rule.responseTimeoutMinutes);
    return expireTime;
  }

  private _checkCanConfirm(entry: WaitlistEntry, rule: any): boolean {
    if (!entry.notifiedAt) return false;
    const now = new Date();
    const notifiedAt = new Date(entry.notifiedAt);
    const diffMinutes = (now.getTime() - notifiedAt.getTime()) / (1000 * 60);
    return diffMinutes <= rule.responseTimeoutMinutes;
  }

  async notifyEntry(id: string, userId?: string) {
    const entry = await this.findOne(id);
    if (entry.status !== 'waiting') {
      throw new BadRequestException('只有等待中的候补记录才能通知');
    }

    const rule = await this.waitlistRulesService.getApplicableRule(entry.counselorId);

    const now = new Date();
    const appointmentDate = new Date(entry.preferredDate);
    const diffHours = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < rule.notificationWindowMinutes / 60) {
      throw new BadRequestException(
        `距离咨询时间不足${rule.notificationWindowMinutes}分钟，不能再通知候补客户`
      );
    }

    await this.waitlistRepository.update(id, {
      status: 'notified',
      notifiedAt: new Date(),
    });

    await this.processingRecordsRepository.save({
      type: 'waitlist_release',
      relatedId: id,
      relatedType: 'waitlist',
      operatorId: userId,
      action: '通知候补客户',
      remarks: `规则: ${rule.ruleName}，响应时限: ${rule.responseTimeoutMinutes}分钟`,
    });

    return this.findOne(id);
  }

  async confirmEntry(id: string, userId?: string) {
    const entry = await this.findOne(id);
    if (entry.status !== 'notified') {
      throw new BadRequestException('只有已通知的候补记录才能确认');
    }

    const rule = await this.waitlistRulesService.getApplicableRule(entry.counselorId);

    if (!entry.canConfirm) {
      throw new BadRequestException(
        `已超过${rule.responseTimeoutMinutes}分钟响应时限，候补已失效`
      );
    }

    const schedule = await this.schedulesRepository
      .createQueryBuilder('schedule')
      .where('schedule.counselorId = :counselorId', { counselorId: entry.counselorId })
      .andWhere('schedule.date = :date', { date: entry.preferredDate })
      .andWhere('schedule.status = :status', { status: 'available' })
      .andWhere(
        'schedule.startTime <= :startTime AND schedule.endTime >= :endTime',
        {
          startTime: entry.preferredStartTime || '09:00',
          endTime: entry.preferredEndTime || '10:00',
        }
      )
      .getOne();

    let scheduleId = null;
    const startTime = entry.preferredStartTime || '09:00';
    const endTime = entry.preferredEndTime || '10:00';

    if (schedule) {
      scheduleId = schedule.id;
      await this.schedulesRepository.update(schedule.id, { status: 'booked' });
    } else {
      const newSchedule = this.schedulesRepository.create({
        counselorId: entry.counselorId,
        date: entry.preferredDate,
        startTime,
        endTime,
        status: 'booked',
        remarks: '候补确认自动占用',
      });
      const savedSchedule = await this.schedulesRepository.save(newSchedule) as unknown as typeof newSchedule;
      scheduleId = savedSchedule.id;
    }

    await this.waitlistRepository.update(id, {
      status: 'confirmed',
      confirmedAt: new Date(),
    });

    const appointment = this.appointmentsRepository.create({
      clientId: entry.clientId,
      counselorId: entry.counselorId,
      serviceId: entry.serviceId,
      appointmentDate: entry.preferredDate,
      startTime,
      endTime,
      visitReason: entry.visitReason,
      status: 'confirmed',
      paymentStatus: 'unpaid',
      amount: 0,
      processedBy: userId,
      processedAt: new Date(),
    });
    const savedAppointment = await this.appointmentsRepository.save(appointment) as unknown as Appointment;

    await this.waitlistRepository.update(id, {
      convertedAppointmentId: savedAppointment.id,
    });

    await this.reorderQueue(entry.counselorId, entry.preferredDate);

    await this.processingRecordsRepository.save({
      type: 'waitlist_release',
      relatedId: id,
      relatedType: 'waitlist',
      operatorId: userId,
      action: '候补确认并转为预约',
      remarks: `转为预约ID: ${savedAppointment.id}，排班ID: ${scheduleId}`,
    });

    return this.findOne(id);
  }

  async cancelEntry(id: string, reason: string, userId?: string) {
    const entry = await this.findOne(id);
    if (entry.status === 'confirmed' || entry.status === 'cancelled' || entry.status === 'expired') {
      throw new BadRequestException('该状态的候补记录不能取消');
    }

    await this.waitlistRepository.update(id, {
      status: 'cancelled',
      cancelReason: reason,
    });

    await this.reorderQueue(entry.counselorId, entry.preferredDate);

    await this.processingRecordsRepository.save({
      type: 'waitlist_add',
      relatedId: id,
      relatedType: 'waitlist',
      operatorId: userId,
      action: '取消候补',
      remarks: reason,
    });

    return this.findOne(id);
  }

  async expireEntry(id: string, userId?: string) {
    const entry = await this.findOne(id);
    if (entry.status !== 'notified') {
      throw new BadRequestException('只有已通知的候补记录才能过期');
    }

    await this.waitlistRepository.update(id, {
      status: 'expired',
      expiredAt: new Date(),
    });

    await this.reorderQueue(entry.counselorId, entry.preferredDate);

    await this.processingRecordsRepository.save({
      type: 'waitlist_release',
      relatedId: id,
      relatedType: 'waitlist',
      operatorId: userId,
      action: '候补过期',
    });

    return this.findOne(id);
  }

  private async reorderQueue(counselorId: string, preferredDate: string) {
    const activeEntries = await this.waitlistRepository.find({
      where: {
        counselorId,
        preferredDate,
        status: 'waiting',
      },
      order: { createdAt: 'ASC' },
    });

    for (let i = 0; i < activeEntries.length; i++) {
      await this.waitlistRepository.update(activeEntries[i].id, {
        queuePosition: i + 1,
      });
    }
  }

  async getQueuePosition(counselorId: string, preferredDate: string) {
    const count = await this.waitlistRepository.count({
      where: {
        counselorId,
        preferredDate,
        status: 'waiting',
      },
    });

    const rule = await this.waitlistRulesService.getApplicableRule(counselorId);

    return {
      queueLength: count,
      maxQueueSize: rule.maxQueueSize,
      ruleName: rule.ruleName,
      canJoin: count < rule.maxQueueSize,
    };
  }

  async getApplicableRule(counselorId?: string) {
    return this.waitlistRulesService.getApplicableRule(counselorId);
  }
}
