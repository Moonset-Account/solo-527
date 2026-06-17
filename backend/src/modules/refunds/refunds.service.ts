import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund } from '../../entities/refund.entity';
import { Appointment } from '../../entities/appointment.entity';
import { ProcessingRecord } from '../../entities/processing-record.entity';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Refund)
    private refundsRepository: Repository<Refund>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(ProcessingRecord)
    private processingRecordsRepository: Repository<ProcessingRecord>,
  ) {}

  async create(createRefundDto: any, userId?: string) {
    const { appointmentId, reason, description, refundAmount } = createRefundDto;

    const appointment = await this.appointmentsRepository.findOne({ where: { id: appointmentId } });
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    const existingRefund = await this.refundsRepository.findOne({
      where: { appointmentId, status: 'pending' },
    });
    if (existingRefund) {
      throw new BadRequestException('该预约已有待处理的退款申请');
    }

    const refund = this.refundsRepository.create({
      appointmentId,
      clientId: appointment.clientId,
      originalAmount: appointment.amount,
      refundAmount: refundAmount || appointment.amount,
      reason,
      description,
      status: 'pending',
    });

    const saved = await this.refundsRepository.save(refund);

    await this.appointmentsRepository.update(appointmentId, {
      paymentStatus: 'refunded',
      refundId: saved.id,
    });

    await this.processingRecordsRepository.save({
      type: 'refund_create',
      relatedId: saved.id,
      relatedType: 'refund',
      operatorId: userId,
      action: '创建退款申请',
      remarks: `退款金额: ${refundAmount}`,
    });

    return saved;
  }

  async findAll(page = 1, pageSize = 10, filters: any = {}) {
    const query = this.refundsRepository.createQueryBuilder('refund')
      .leftJoinAndSelect('refund.client', 'client')
      .leftJoinAndSelect('refund.appointment', 'appointment');

    if (filters.status) {
      query.andWhere('refund.status = :status', { status: filters.status });
    }
    if (filters.reason) {
      query.andWhere('refund.reason = :reason', { reason: filters.reason });
    }
    if (filters.clientId) {
      query.andWhere('refund.clientId = :clientId', { clientId: filters.clientId });
    }

    query.orderBy('refund.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await query.getManyAndCount();

    return {
      items: items.map(item => ({
        ...item,
        client: item.client ? { id: item.client.id, name: item.client.name, phone: item.client.phone } : null,
        appointment: item.appointment ? { id: item.appointment.id, appointmentDate: item.appointment.appointmentDate } : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const refund = await this.refundsRepository.findOne({
      where: { id },
      relations: ['client', 'appointment'],
    });
    if (!refund) {
      throw new NotFoundException('退款记录不存在');
    }
    return {
      ...refund,
      client: refund.client ? { id: refund.client.id, name: refund.client.name, phone: refund.client.phone } : null,
      appointment: refund.appointment ? { id: refund.appointment.id, appointmentDate: refund.appointment.appointmentDate } : null,
    };
  }

  async approve(id: string, approvedBy: string, userId?: string) {
    const refund = await this.findOne(id);
    if (refund.status !== 'pending') {
      throw new BadRequestException('只有待处理状态的退款才能批准');
    }

    await this.refundsRepository.update(id, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      processedBy: userId,
      processedAt: new Date(),
    });

    await this.processingRecordsRepository.save({
      type: 'refund_approve',
      relatedId: id,
      relatedType: 'refund',
      operatorId: userId,
      action: '批准退款',
    });

    return this.findOne(id);
  }

  async reject(id: string, rejectReason: string, userId?: string) {
    const refund = await this.findOne(id);
    if (refund.status !== 'pending') {
      throw new BadRequestException('只有待处理状态的退款才能拒绝');
    }

    await this.refundsRepository.update(id, {
      status: 'rejected',
      rejectReason,
      processedBy: userId,
      processedAt: new Date(),
    });

    await this.appointmentsRepository.update(refund.appointmentId, {
      paymentStatus: 'paid',
    });

    await this.processingRecordsRepository.save({
      type: 'refund_reject',
      relatedId: id,
      relatedType: 'refund',
      operatorId: userId,
      action: '拒绝退款',
      remarks: rejectReason,
    });

    return this.findOne(id);
  }

  async complete(id: string, refundMethod: string, transactionId?: string, userId?: string) {
    const refund = await this.findOne(id);
    if (refund.status !== 'approved') {
      throw new BadRequestException('只有已批准的退款才能完成');
    }

    await this.refundsRepository.update(id, {
      status: 'completed',
      completedAt: new Date(),
      refundMethod,
      transactionId,
    });

    await this.processingRecordsRepository.save({
      type: 'refund_approve',
      relatedId: id,
      relatedType: 'refund',
      operatorId: userId,
      action: '完成退款',
      remarks: `退款方式: ${refundMethod}`,
    });

    return this.findOne(id);
  }

  async findByClient(clientId: string, page = 1, pageSize = 10) {
    const [items, total] = await this.refundsRepository.findAndCount({
      where: { clientId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }
}
