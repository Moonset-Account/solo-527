import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from '../../entities/appointment.entity';
import { Schedule } from '../../entities/schedule.entity';
import { ProcessingRecord } from '../../entities/processing-record.entity';
import { WaitlistEntry } from '../../entities/waitlist-entry.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(ProcessingRecord)
    private processingRecordsRepository: Repository<ProcessingRecord>,
    @InjectRepository(WaitlistEntry)
    private waitlistEntriesRepository: Repository<WaitlistEntry>,
  ) {}

  async create(createAppointmentDto: any, userId: string) {
    const { counselorId, serviceId, appointmentDate, startTime, endTime, visitReason, clientNotes, amount } = createAppointmentDto;

    const conflict = await this.appointmentsRepository.findOne({
      where: {
        counselorId,
        appointmentDate,
        status: 'confirmed',
      },
    });

    if (conflict) {
      const existingStart = conflict.startTime;
      const existingEnd = conflict.endTime;
      if (!(endTime <= existingStart || startTime >= existingEnd)) {
        throw new BadRequestException('该时段已被预约，请选择其他时间');
      }
    }

    const appointment = this.appointmentsRepository.create({
      clientId: userId,
      counselorId,
      serviceId,
      appointmentDate,
      startTime,
      endTime,
      visitReason,
      clientNotes,
      amount: amount || 0,
      status: 'pending',
      paymentStatus: 'unpaid',
    });

    const saved = await this.appointmentsRepository.save(appointment);

    await this.processingRecordsRepository.save({
      type: 'appointment_create',
      relatedId: saved.id,
      relatedType: 'appointment',
      operatorId: userId,
      action: '创建预约',
      remarks: `预约${appointmentDate} ${startTime}-${endTime}`,
    });

    return saved;
  }

  async findAll(page = 1, pageSize = 10, filters: any = {}) {
    const query = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.counselor', 'counselor')
      .leftJoinAndSelect('appointment.service', 'service');

    if (filters.status) {
      query.andWhere('appointment.status = :status', { status: filters.status });
    }
    if (filters.paymentStatus) {
      query.andWhere('appointment.paymentStatus = :paymentStatus', { paymentStatus: filters.paymentStatus });
    }
    if (filters.counselorId) {
      query.andWhere('appointment.counselorId = :counselorId', { counselorId: filters.counselorId });
    }
    if (filters.clientId) {
      query.andWhere('appointment.clientId = :clientId', { clientId: filters.clientId });
    }
    if (filters.startDate) {
      query.andWhere('appointment.appointmentDate >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      query.andWhere('appointment.appointmentDate <= :endDate', { endDate: filters.endDate });
    }

    query.orderBy('appointment.createdAt', 'DESC')
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

  async findOne(id: string) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['client', 'counselor', 'service'],
    });
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }
    return {
      ...appointment,
      client: appointment.client ? { id: appointment.client.id, name: appointment.client.name, phone: appointment.client.phone } : null,
      counselor: appointment.counselor ? { id: appointment.counselor.id, name: appointment.counselor.name } : null,
      service: appointment.service ? { id: appointment.service.id, name: appointment.service.name } : null,
    };
  }

  async findByClient(clientId: string, page = 1, pageSize = 10) {
    const [items, total] = await this.appointmentsRepository.findAndCount({
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

  async update(id: string, updateAppointmentDto: any, userId?: string) {
    const appointment = await this.findOne(id);
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    const beforeState = JSON.stringify(appointment);
    await this.appointmentsRepository.update(id, updateAppointmentDto);
    const updated = await this.findOne(id);

    await this.processingRecordsRepository.save({
      type: 'appointment_create',
      relatedId: id,
      relatedType: 'appointment',
      operatorId: userId,
      action: '更新预约',
      beforeState,
      afterState: JSON.stringify(updated),
    });

    return updated;
  }

  async confirm(id: string, userId?: string) {
    const appointment = await this.findOne(id);
    if (appointment.status !== 'pending') {
      throw new BadRequestException('只有待确认状态的预约才能确认');
    }

    await this.appointmentsRepository.update(id, {
      status: 'confirmed',
      processedBy: userId,
      processedAt: new Date(),
    });

    await this.processingRecordsRepository.save({
      type: 'appointment_create',
      relatedId: id,
      relatedType: 'appointment',
      operatorId: userId,
      action: '确认预约',
    });

    return this.findOne(id);
  }

  async cancel(id: string, reason: string, cancelledBy: string, userId?: string) {
    const appointment = await this.findOne(id);
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      throw new BadRequestException('该状态的预约不能取消');
    }

    await this.appointmentsRepository.update(id, {
      status: 'cancelled',
      cancelReason: reason,
      cancelTime: new Date(),
      cancelledBy,
    });

    await this.processingRecordsRepository.save({
      type: 'appointment_cancel',
      relatedId: id,
      relatedType: 'appointment',
      operatorId: userId,
      action: '取消预约',
      remarks: reason,
    });

    return this.findOne(id);
  }

  async complete(id: string, counselorNotes: string, userId?: string) {
    const appointment = await this.findOne(id);
    if (appointment.status !== 'confirmed') {
      throw new BadRequestException('只有已确认的预约才能完成');
    }

    await this.appointmentsRepository.update(id, {
      status: 'completed',
      counselorNotes,
    });

    await this.processingRecordsRepository.save({
      type: 'appointment_complete',
      relatedId: id,
      relatedType: 'appointment',
      operatorId: userId,
      action: '完成预约',
    });

    return this.findOne(id);
  }

  async markNoShow(id: string, userId?: string) {
    const appointment = await this.findOne(id);
    if (appointment.status !== 'confirmed') {
      throw new BadRequestException('只有已确认的预约才能标记为爽约');
    }

    await this.appointmentsRepository.update(id, {
      status: 'no_show',
    });

    await this.processingRecordsRepository.save({
      type: 'appointment_cancel',
      relatedId: id,
      relatedType: 'appointment',
      operatorId: userId,
      action: '标记爽约',
    });

    return this.findOne(id);
  }

  async updatePayment(id: string, paymentStatus: string, paymentMethod?: string, failureReason?: string) {
    const appointment = await this.findOne(id);
    const updateData: any = { paymentStatus };

    if (paymentStatus === 'paid') {
      updateData.paymentTime = new Date();
      updateData.paymentMethod = paymentMethod;
    }
    if (paymentStatus === 'failed' && failureReason) {
      updateData.paymentFailureReason = failureReason;
    }

    await this.appointmentsRepository.update(id, updateData);
    return this.findOne(id);
  }
}
