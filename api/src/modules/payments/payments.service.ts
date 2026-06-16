import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRecord } from '../../entities/payment-record.entity.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { UpdatePaymentDto } from './dto/update-payment.dto.js';
import { PaymentResultDto } from './dto/payment-result.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { PaginatedResult } from '../../common/types/paginated-result.type.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentRecord)
    private readonly paymentRepo: Repository<PaymentRecord>,
  ) {}

  async create(dto: CreatePaymentDto): Promise<PaymentRecord> {
    const payment = this.paymentRepo.create({
      ...dto,
      status: 'pending',
    });
    return this.paymentRepo.save(payment);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<PaymentRecord>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.paymentRepo.findAndCount({
      where,
      relations: ['settlement', 'contract'],
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<PaymentRecord> {
    const payment = await this.paymentRepo.findOne({ where: { id }, relations: ['settlement', 'contract'] });
    if (!payment) throw new NotFoundException(`PaymentRecord #${id} not found`);
    return payment;
  }

  async update(id: number, dto: UpdatePaymentDto): Promise<PaymentRecord> {
    const payment = await this.findOne(id);
    Object.assign(payment, dto);
    return this.paymentRepo.save(payment);
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepo.remove(payment);
  }

  async retry(id: number): Promise<PaymentRecord> {
    const payment = await this.findOne(id);
    if (payment.status !== 'failed') {
      throw new BadRequestException('Only failed payments can be retried');
    }
    payment.retryCount += 1;
    payment.status = 'pending';
    payment.errorMessage = '';
    return this.paymentRepo.save(payment);
  }

  async updateResult(id: number, dto: PaymentResultDto): Promise<PaymentRecord> {
    const payment = await this.findOne(id);
    payment.status = dto.status;
    if (dto.status === 'success') {
      payment.paidAt = new Date();
      payment.transactionId = dto.transactionId || payment.transactionId;
      payment.errorMessage = '';
    } else if (dto.status === 'failed') {
      payment.errorMessage = dto.errorMessage ?? '';
    }
    return this.paymentRepo.save(payment);
  }
}
