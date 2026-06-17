import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaitlistEntry } from '../../entities/waitlist-entry.entity';
import { Appointment } from '../../entities/appointment.entity';
import { ProcessingRecord } from '../../entities/processing-record.entity';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectRepository(WaitlistEntry)
    private waitlistRepository: Repository<WaitlistEntry>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(ProcessingRecord)
    private processingRecordsRepository: Repository<ProcessingRecord>,
  ) {}

  async joinWaitlist(joinDto: any, userId: string) {
    const { counselorId, serviceId, preferredDate, preferredStartTime, preferredEndTime, visitReason } = joinDto;

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

    const saved = await this.waitlistRepository.save(entry);

    await this.processingRecordsRepository.save({
      type: 'waitlist_add',
      relatedId: saved.id,
      relatedType: 'waitlist',
      operatorId: userId,
      action: '加入候补队列',
      remarks: `队列位置: ${queuePosition}`,
    });

    return saved;
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
    return {
      ...entry,
      client: entry.client ? { id: entry.client.id, name: entry.client.name, phone: entry.client.phone } : null,
      counselor: entry.counselor ? { id: entry.counselor.id, name: entry.counselor.name } : null,
      service: entry.service ? { id: entry.service.id, name: entry.service.name } : null,
    };
  }

  async notifyEntry(id: string, userId?: string) {
    const entry = await this.findOne(id);
    if (entry.status !== 'waiting') {
      throw new BadRequestException('只有等待中的候候补记录才能通知');
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
    });

    return this.findOne(id);
  }

  async confirmEntry(id: string, userId?: string) {
    const entry = await this.findOne(id);
    if (entry.status !== 'notified') {
      throw new BadRequestException('只有已通知的候补记录才能确认');
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
      startTime: entry.preferredStartTime || '09:00',
      endTime: entry.preferredEndTime || '10:00',
      visitReason: entry.visitReason,
      status: 'confirmed',
      paymentStatus: 'unpaid',
      amount: 0,
    });
    const savedAppointment = await this.appointmentsRepository.save(appointment);

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
      remarks: `转为预约ID: ${savedAppointment.id}`,
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
    return { queueLength: count };
  }
}
