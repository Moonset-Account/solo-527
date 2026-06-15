import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource, In, Brackets } from 'typeorm';
import { differenceInDays } from 'date-fns';
import { Bill, BillStatus, StatusHistory, Customer } from '@/database/entities';
import { CreateBillDto, UpdateBillDto, UpdateBillStatusDto, RecordPaymentDto, BillFilterDto } from './dto/bill.dto';
import { AuditLogService } from '@/common/services/audit-log.service';

@Injectable()
export class BillService {
  constructor(
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(StatusHistory)
    private statusHistoryRepository: Repository<StatusHistory>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private dataSource: DataSource,
    private auditLogService: AuditLogService,
  ) {}

  async create(createBillDto: CreateBillDto, userId?: string): Promise<Bill> {
    const customer = await this.customerRepository.findOne({
      where: { id: createBillDto.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const billNumber = await this.generateBillNumber();
      const bill = this.billRepository.create({
        ...createBillDto,
        billNumber,
        remainingAmount: createBillDto.totalAmount,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedBill = await queryRunner.manager.save(bill);

      if (createBillDto.status && createBillDto.status !== 'draft') {
        const statusHistory = this.statusHistoryRepository.create({
          billId: savedBill.id,
          fromStatus: 'draft',
          toStatus: createBillDto.status,
          reason: 'Bill created with initial status',
          createdBy: userId,
        });
        await queryRunner.manager.save(statusHistory);
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedBill.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters: BillFilterDto): Promise<{ data: Bill[]; total: number }> {
    const queryBuilder = this.billRepository.createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('bill.subscription', 'subscription')
      .leftJoinAndSelect('bill.statusHistory', 'statusHistory');

    if (filters.customerId) {
      queryBuilder.andWhere('bill.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters.subscriptionId) {
      queryBuilder.andWhere('bill.subscriptionId = :subscriptionId', { subscriptionId: filters.subscriptionId });
    }

    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('bill.status IN (:...status)', { status: filters.status });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('bill.issueDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('bill.issueDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.dueDateStart) {
      queryBuilder.andWhere('bill.dueDate >= :dueDateStart', { dueDateStart: filters.dueDateStart });
    }

    if (filters.dueDateEnd) {
      queryBuilder.andWhere('bill.dueDate <= :dueDateEnd', { dueDateEnd: filters.dueDateEnd });
    }

    if (filters.billNumber) {
      queryBuilder.andWhere('bill.billNumber ILIKE :billNumber', { billNumber: `%${filters.billNumber}%` });
    }

    if (filters.search) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('bill.billNumber ILIKE :search', { search: `%${filters.search}%` })
          .orWhere('customer.name ILIKE :search', { search: `%${filters.search}%` })
          .orWhere('customer.email ILIKE :search', { search: `%${filters.search}%` });
      }));
    }

    if (filters.minOverdueDays !== undefined) {
      queryBuilder.andWhere('bill.overdueDays >= :minOverdueDays', { minOverdueDays: filters.minOverdueDays });
    }

    if (filters.maxOverdueDays !== undefined) {
      queryBuilder.andWhere('bill.overdueDays <= :maxOverdueDays', { maxOverdueDays: filters.maxOverdueDays });
    }

    if (filters.minAmount !== undefined) {
      queryBuilder.andWhere('bill.totalAmount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters.maxAmount !== undefined) {
      queryBuilder.andWhere('bill.totalAmount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    const sortBy = filters.sortBy || 'bill.createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(sortBy, sortOrder as 'ASC' | 'DESC');

    queryBuilder.skip((filters.page - 1) * filters.limit);
    queryBuilder.take(filters.limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Bill> {
    const bill = await this.billRepository.findOne({
      where: { id },
      relations: ['customer', 'subscription', 'statusHistory', 'collectionRecords', 'invoices', 'attachments'],
    });
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }
    return bill;
  }

  async update(id: string, updateBillDto: UpdateBillDto, userId?: string): Promise<Bill> {
    const bill = await this.findOne(id);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedBill = this.billRepository.merge(bill, {
        ...updateBillDto,
        updatedBy: userId,
      });

      if (updateBillDto.status && updateBillDto.status !== bill.status) {
        const statusHistory = this.statusHistoryRepository.create({
          billId: bill.id,
          fromStatus: bill.status,
          toStatus: updateBillDto.status,
          reason: 'Status updated',
          changedFields: {
            status: { oldValue: bill.status, newValue: updateBillDto.status },
          },
          createdBy: userId,
        });
        await queryRunner.manager.save(statusHistory);
      }

      if (updateBillDto.paidAmount !== undefined) {
        updatedBill.remainingAmount = updatedBill.totalAmount - updateBillDto.paidAmount;
      }

      const saved = await queryRunner.manager.save(updatedBill);
      await queryRunner.commitTransaction();
      return this.findOne(saved.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: string, updateStatusDto: UpdateBillStatusDto, userId?: string): Promise<Bill> {
    const bill = await this.findOne(id);

    if (bill.status === updateStatusDto.status) {
      return bill;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const statusHistory = this.statusHistoryRepository.create({
        billId: bill.id,
        fromStatus: bill.status,
        toStatus: updateStatusDto.status,
        reason: updateStatusDto.reason,
        changedFields: {
          status: { oldValue: bill.status, newValue: updateStatusDto.status },
        },
        createdBy: userId,
      });
      await queryRunner.manager.save(statusHistory);

      bill.status = updateStatusDto.status;
      bill.updatedBy = userId;

      const saved = await queryRunner.manager.save(bill);
      await queryRunner.commitTransaction();
      return this.findOne(saved.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async recordPayment(id: string, paymentDto: RecordPaymentDto, userId?: string): Promise<Bill> {
    const bill = await this.findOne(id);

    if (bill.status === 'paid' || bill.status === 'written_off') {
      throw new BadRequestException('Cannot record payment for this bill status');
    }

    const newPaidAmount = Number(bill.paidAmount) + Number(paymentDto.amount);
    if (newPaidAmount > bill.totalAmount) {
      throw new BadRequestException('Payment amount exceeds total bill amount');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const oldStatus = bill.status;
      bill.paidAmount = newPaidAmount;
      bill.remainingAmount = Number(bill.totalAmount) - newPaidAmount;
      bill.updatedBy = userId;

      let newStatus: BillStatus = bill.status;
      if (bill.remainingAmount === 0) {
        newStatus = 'paid';
      } else if (bill.paidAmount > 0) {
        newStatus = 'partial';
      }

      if (newStatus !== oldStatus) {
        const statusHistory = this.statusHistoryRepository.create({
          billId: bill.id,
          fromStatus: oldStatus,
          toStatus: newStatus,
          reason: `Payment recorded: ${paymentDto.amount}`,
          changedFields: {
            paidAmount: { oldValue: bill.paidAmount - paymentDto.amount, newValue: bill.paidAmount },
            remainingAmount: { oldValue: bill.remainingAmount + paymentDto.amount, newValue: bill.remainingAmount },
            status: { oldValue: oldStatus, newValue: newStatus },
          },
          createdBy: userId,
        });
        await queryRunner.manager.save(statusHistory);
        bill.status = newStatus;
      }

      const saved = await queryRunner.manager.save(bill);
      await queryRunner.commitTransaction();
      return this.findOne(saved.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStatusHistory(billId: string): Promise<StatusHistory[]> {
    await this.findOne(billId);
    return this.statusHistoryRepository.find({
      where: { billId },
      order: { createdAt: 'DESC' },
    });
  }

  async getOverdueBills(): Promise<Bill[]> {
    const now = new Date();
    return this.billRepository.createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .where('bill.dueDate < :now', { now })
      .andWhere('bill.status NOT IN (:...paidStatuses)', { paidStatuses: ['paid', 'written_off'] })
      .andWhere('bill.remainingAmount > 0')
      .orderBy('bill.overdueDays', 'DESC')
      .getMany();
  }

  async updateOverdueStatuses(): Promise<void> {
    const bills = await this.billRepository.createQueryBuilder('bill')
      .where('bill.status NOT IN (:...excludedStatuses)', { excludedStatuses: ['paid', 'written_off', 'draft'] })
      .andWhere('bill.remainingAmount > 0')
      .getMany();

    const now = new Date();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const bill of bills) {
        const overdueDays = differenceInDays(now, bill.dueDate);
        const newOverdueDays = Math.max(0, overdueDays);

        if (newOverdueDays !== bill.overdueDays) {
          bill.overdueDays = newOverdueDays;

          if (newOverdueDays > 0 && bill.status !== 'overdue' && bill.status !== 'partial') {
            const statusHistory = this.statusHistoryRepository.create({
              billId: bill.id,
              fromStatus: bill.status,
              toStatus: 'overdue',
              reason: `Bill is ${newOverdueDays} days overdue`,
              changedFields: {
                overdueDays: { oldValue: bill.overdueDays, newValue: newOverdueDays },
                status: { oldValue: bill.status, newValue: 'overdue' },
              },
            });
            await queryRunner.manager.save(statusHistory);
            bill.status = 'overdue';
          }

          await queryRunner.manager.save(bill);
        }
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async generateBillNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `BILL-${year}-`;

    const lastBill = await this.billRepository.createQueryBuilder('bill')
      .where('bill.billNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('bill.billNumber', 'DESC')
      .setLock('pessimistic_write')
      .getOne();

    let sequence = 1;
    if (lastBill) {
      const parts = lastBill.billNumber.split('-');
      sequence = parseInt(parts[parts.length - 1]) + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }

  async getStatistics(filters: any = {}): Promise<any> {
    const queryBuilder = this.billRepository.createQueryBuilder('bill');

    if (filters.startDate) {
      queryBuilder.andWhere('bill.issueDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('bill.issueDate <= :endDate', { endDate: filters.endDate });
    }

    const statusCounts = await queryBuilder
      .select('bill.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(bill.totalAmount)', 'totalAmount')
      .addSelect('SUM(bill.remainingAmount)', 'remainingAmount')
      .groupBy('bill.status')
      .getRawMany();

    const totals = await this.billRepository.createQueryBuilder('bill')
      .select('COUNT(*)', 'totalBills')
      .addSelect('SUM(bill.totalAmount)', 'totalAmount')
      .addSelect('SUM(bill.paidAmount)', 'paidAmount')
      .addSelect('SUM(bill.remainingAmount)', 'remainingAmount')
      .addSelect('SUM(CASE WHEN bill.status = \'overdue\' THEN bill.remainingAmount ELSE 0 END)', 'overdueAmount')
      .addSelect('AVG(bill.overdueDays)', 'avgOverdueDays')
      .getRawOne();

    return {
      summary: {
        totalBills: parseInt(totals.totalBills || 0),
        totalAmount: parseFloat(totals.totalAmount || 0),
        paidAmount: parseFloat(totals.paidAmount || 0),
        remainingAmount: parseFloat(totals.remainingAmount || 0),
        overdueAmount: parseFloat(totals.overdueAmount || 0),
        avgOverdueDays: parseFloat(totals.avgOverdueDays || 0),
      },
      byStatus: statusCounts.map(s => ({
        status: s.status,
        count: parseInt(s.count),
        totalAmount: parseFloat(s.totalAmount),
        remainingAmount: parseFloat(s.remainingAmount),
      })),
    };
  }
}
