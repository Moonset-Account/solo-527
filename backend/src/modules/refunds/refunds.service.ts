import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund } from '../../entities/refund.entity';
import { Appointment } from '../../entities/appointment.entity';
import { ProcessingRecord } from '../../entities/processing-record.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Refund)
    private refundsRepository: Repository<Refund>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(ProcessingRecord)
    private processingRecordsRepository: Repository<ProcessingRecord>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
      processedBy: userId,
      processedAt: new Date(),
    });

    const saved = await this.refundsRepository.save(refund) as unknown as Refund;

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

    query.orderBy('refund.updatedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await query.getManyAndCount();
    const userMap = new Map();
    const userIds = new Set<string>();

    items.forEach(item => {
      if (item.processedBy) userIds.add(item.processedBy);
      if (item.approvedBy) userIds.add(item.approvedBy);
    });

    if (userIds.size > 0) {
      const users = await this.usersRepository.findByIds([...userIds]);
      users.forEach(u => userMap.set(u.id, u));
    }

    return {
      items: items.map(item => ({
        ...item,
        client: item.client ? { id: item.client.id, name: item.client.name, phone: item.client.phone } : null,
        appointment: item.appointment ? { id: item.appointment.id, appointmentDate: item.appointment.appointmentDate } : null,
        processedByUser: item.processedBy && userMap.get(item.processedBy)
          ? { id: userMap.get(item.processedBy).id, name: userMap.get(item.processedBy).name, role: userMap.get(item.processedBy).role }
          : null,
        approvedByUser: item.approvedBy && userMap.get(item.approvedBy)
          ? { id: userMap.get(item.approvedBy).id, name: userMap.get(item.approvedBy).name, role: userMap.get(item.approvedBy).role }
          : null,
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

    const userMap = new Map();
    const userIds = new Set<string>();
    if (refund.processedBy) userIds.add(refund.processedBy);
    if (refund.approvedBy) userIds.add(refund.approvedBy);

    if (userIds.size > 0) {
      const users = await this.usersRepository.findByIds([...userIds]);
      users.forEach(u => userMap.set(u.id, u));
    }

    return {
      ...refund,
      client: refund.client ? { id: refund.client.id, name: refund.client.name, phone: refund.client.phone } : null,
      appointment: refund.appointment ? { id: refund.appointment.id, appointmentDate: refund.appointment.appointmentDate } : null,
      processedByUser: refund.processedBy && userMap.get(refund.processedBy)
        ? { id: userMap.get(refund.processedBy).id, name: userMap.get(refund.processedBy).name, role: userMap.get(refund.processedBy).role }
        : null,
      approvedByUser: refund.approvedBy && userMap.get(refund.approvedBy)
        ? { id: userMap.get(refund.approvedBy).id, name: userMap.get(refund.approvedBy).name, role: userMap.get(refund.approvedBy).role }
        : null,
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
