import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from './entities/bill.entity';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { BillQueryDto } from './dto/bill-query.dto';
import { ReconcileBillDto } from './dto/reconcile-bill.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(
    createBillDto: CreateBillDto,
    operatorId?: string,
    ip?: string,
  ): Promise<Bill> {
    const bill = this.billRepository.create(createBillDto);
    const saved = await this.billRepository.save(bill);

    await this.auditLogsService.create(
      'bills',
      'create',
      'Bill',
      saved.id,
      null,
      saved,
      operatorId,
      ip,
    );

    return saved;
  }

  async findAll(
    query: BillQueryDto,
  ): Promise<{ items: Bill[]; total: number; page: number; pageSize: number }> {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      leaseId,
      type,
      status,
      billDateFrom,
      billDateTo,
      dueDateFrom,
      dueDateTo,
      reconciled,
      source,
    } = query;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.billRepository.createQueryBuilder('bill');

    if (keyword) {
      queryBuilder.andWhere('bill.billNo LIKE :keyword', { keyword: `%${keyword}%` });
    }
    if (leaseId) {
      queryBuilder.andWhere('bill.leaseId = :leaseId', { leaseId });
    }
    if (type) {
      queryBuilder.andWhere('bill.type = :type', { type });
    }
    if (status) {
      queryBuilder.andWhere('bill.status = :status', { status });
    }
    if (billDateFrom) {
      queryBuilder.andWhere('bill.billDate >= :billDateFrom', { billDateFrom });
    }
    if (billDateTo) {
      queryBuilder.andWhere('bill.billDate <= :billDateTo', { billDateTo });
    }
    if (dueDateFrom) {
      queryBuilder.andWhere('bill.dueDate >= :dueDateFrom', { dueDateFrom });
    }
    if (dueDateTo) {
      queryBuilder.andWhere('bill.dueDate <= :dueDateTo', { dueDateTo });
    }
    if (reconciled !== undefined) {
      queryBuilder.andWhere('bill.reconciled = :reconciled', { reconciled });
    }
    if (source) {
      queryBuilder.andWhere('bill.source = :source', { source });
    }

    queryBuilder.leftJoinAndSelect('bill.lease', 'lease');
    queryBuilder.leftJoinAndSelect('bill.reconciler', 'reconciler');
    queryBuilder.orderBy('bill.createdAt', 'DESC');
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<Bill> {
    const bill = await this.billRepository.findOne({
      where: { id },
      relations: ['lease', 'reconciler'],
    });
    if (!bill) {
      throw new NotFoundException(`Bill with ID ${id} not found`);
    }
    return bill;
  }

  async findByBillNo(billNo: string): Promise<Bill | undefined> {
    return this.billRepository.findOneBy({ billNo });
  }

  async update(
    id: string,
    updateBillDto: UpdateBillDto,
    operatorId?: string,
    ip?: string,
  ): Promise<Bill> {
    const bill = await this.findOne(id);
    const oldValue = { ...bill };

    Object.assign(bill, updateBillDto);
    const saved = await this.billRepository.save(bill);

    await this.auditLogsService.create(
      'bills',
      'update',
      'Bill',
      id,
      oldValue,
      saved,
      operatorId,
      ip,
    );

    return saved;
  }

  async reconcile(
    id: string,
    reconcileDto: ReconcileBillDto,
    operatorId?: string,
    ip?: string,
  ): Promise<Bill> {
    const bill = await this.findOne(id);
    const oldValue = { ...bill };

    bill.reconciled = reconcileDto.reconciled;
    if (reconcileDto.reconciled) {
      bill.reconciledAt = new Date();
      bill.reconciledBy = operatorId;
      
      if (reconcileDto.paidAmount !== undefined) {
        bill.paidAmount = reconcileDto.paidAmount;
        if (reconcileDto.paidAmount >= bill.amount) {
          bill.status = 'paid';
        } else if (reconcileDto.paidAmount > 0) {
          bill.status = 'partial';
        }
      }
      if (reconcileDto.paidDate) {
        bill.paidDate = reconcileDto.paidDate;
      }
      if (reconcileDto.sourceRemark) {
        bill.sourceRemark = reconcileDto.sourceRemark;
      }
    } else {
      bill.reconciledAt = null;
      bill.reconciledBy = null;
    }

    const saved = await this.billRepository.save(bill);

    await this.auditLogsService.create(
      'bills',
      'update',
      'Bill',
      id,
      oldValue,
      saved,
      operatorId,
      ip,
    );

    return saved;
  }

  async remove(
    id: string,
    operatorId?: string,
    ip?: string,
  ): Promise<void> {
    const bill = await this.findOne(id);
    const oldValue = { ...bill };

    const result = await this.billRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Bill with ID ${id} not found`);
    }

    await this.auditLogsService.create(
      'bills',
      'delete',
      'Bill',
      id,
      oldValue,
      null,
      operatorId,
      ip,
    );
  }
}
