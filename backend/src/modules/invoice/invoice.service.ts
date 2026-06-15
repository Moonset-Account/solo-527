import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice, Bill, Customer } from '@/database/entities';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceFilterDto, InvoiceStatus } from './dto/invoice.dto';
import { AuditLogService } from '@/common/services/audit-log.service';

const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['issued', 'cancelled'],
  issued: ['sent', 'paid', 'overdue', 'cancelled'],
  sent: ['paid', 'overdue', 'cancelled'],
  paid: [],
  overdue: ['paid', 'cancelled'],
  cancelled: [],
};

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(Customer)
    private _customerRepository: Repository<Customer>,
    private dataSource: DataSource,
    private _auditLogService: AuditLogService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, userId?: string): Promise<Invoice> {
    const bill = await this.billRepository.findOne({
      where: { id: createInvoiceDto.billId },
      relations: ['customer'],
    });
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceNumber = createInvoiceDto.invoiceNumber || await this.generateInvoiceNumber();
      
      const invoice = this.invoiceRepository.create({
        ...createInvoiceDto,
        invoiceNumber,
        currency: createInvoiceDto.currency || bill.currency,
        invoiceDate: createInvoiceDto.issueDate ? new Date(createInvoiceDto.issueDate) : new Date(),
        dueDate: createInvoiceDto.dueDate ? new Date(createInvoiceDto.dueDate) : bill.dueDate,
        customerAddress: bill.customer?.address,
        subtotal: createInvoiceDto.amount,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedInvoice = await queryRunner.manager.save(invoice);
      await queryRunner.commitTransaction();
      return this.findOne(savedInvoice.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters: InvoiceFilterDto): Promise<{ data: Invoice[]; total: number }> {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.bill', 'bill')
      .leftJoinAndSelect('bill.customer', 'customer');

    if (filters.billId) {
      queryBuilder.andWhere('invoice.billId = :billId', { billId: filters.billId });
    }

    if (filters.customerId) {
      queryBuilder.andWhere('bill.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters.status) {
      queryBuilder.andWhere('invoice.status = :status', { status: filters.status });
    }

    if (filters.invoiceNumber) {
      queryBuilder.andWhere('invoice.invoiceNumber ILIKE :invoiceNumber', { invoiceNumber: `%${filters.invoiceNumber}%` });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('invoice.invoiceDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('invoice.invoiceDate <= :endDate', { endDate: filters.endDate });
    }

    const sortBy = filters.sortBy || 'invoice.createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(sortBy, sortOrder as 'ASC' | 'DESC');

    queryBuilder.skip((filters.page - 1) * filters.limit);
    queryBuilder.take(filters.limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['bill', 'bill.customer'],
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, userId?: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (updateInvoiceDto.status && updateInvoiceDto.status !== invoice.status) {
      this.validateStatusTransition(invoice.status as InvoiceStatus, updateInvoiceDto.status);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedInvoice = this.invoiceRepository.merge(invoice, {
        ...updateInvoiceDto,
        paidDate: updateInvoiceDto.paidDate ? new Date(updateInvoiceDto.paidDate) : invoice.paidDate,
        updatedBy: userId,
      });

      if (updateInvoiceDto.status === 'sent' && !invoice.sentDate) {
        updatedInvoice.sentDate = new Date();
      }

      if (updateInvoiceDto.status === 'paid' && !invoice.paidDate) {
        updatedInvoice.paidDate = new Date();
      }

      const saved = await queryRunner.manager.save(updatedInvoice);
      await queryRunner.commitTransaction();
      return this.findOne(saved.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string, _userId?: string): Promise<void> {
    const invoice = await this.findOne(id);

    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be deleted');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(Invoice, id);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStatistics(filters: any = {}): Promise<any> {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice');

    if (filters.startDate) {
      queryBuilder.andWhere('invoice.invoiceDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('invoice.invoiceDate <= :endDate', { endDate: filters.endDate });
    }

    const statusStats = await queryBuilder
      .select('invoice.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(invoice.amount)', 'totalAmount')
      .groupBy('invoice.status')
      .getRawMany();

    const totals = await this.invoiceRepository.createQueryBuilder('invoice')
      .select('COUNT(*)', 'totalInvoices')
      .addSelect('SUM(invoice.amount)', 'totalAmount')
      .addSelect('SUM(CASE WHEN invoice.status = \'paid\' THEN invoice.amount ELSE 0 END)', 'paidAmount')
      .addSelect('SUM(CASE WHEN invoice.status IN (\'issued\', \'sent\', \'overdue\') THEN invoice.amount ELSE 0 END)', 'outstandingAmount')
      .addSelect('SUM(CASE WHEN invoice.status = \'overdue\' THEN invoice.amount ELSE 0 END)', 'overdueAmount')
      .getRawOne();

    return {
      summary: {
        totalInvoices: parseInt(totals.totalInvoices || 0),
        totalAmount: parseFloat(totals.totalAmount || 0),
        paidAmount: parseFloat(totals.paidAmount || 0),
        outstandingAmount: parseFloat(totals.outstandingAmount || 0),
        overdueAmount: parseFloat(totals.overdueAmount || 0),
      },
      byStatus: statusStats.map(s => ({
        status: s.status,
        count: parseInt(s.count),
        totalAmount: parseFloat(s.totalAmount || 0),
      })),
    };
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const lastInvoice = await this.invoiceRepository.createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('invoice.invoiceNumber', 'DESC')
      .setLock('pessimistic_write')
      .getOne();

    let sequence = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      sequence = parseInt(parts[parts.length - 1]) + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }

  private validateStatusTransition(fromStatus: InvoiceStatus, toStatus: InvoiceStatus): void {
    const allowedTransitions = STATUS_TRANSITIONS[fromStatus];
    if (!allowedTransitions.includes(toStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${fromStatus} to ${toStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`
      );
    }
  }
}
