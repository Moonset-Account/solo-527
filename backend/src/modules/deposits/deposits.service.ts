import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit } from './entities/deposit.entity';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { DepositQueryDto } from './dto/deposit-query.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class DepositsService {
  constructor(
    @InjectRepository(Deposit)
    private depositRepository: Repository<Deposit>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(
    createDepositDto: CreateDepositDto,
    operatorId?: string,
    ip?: string,
  ): Promise<Deposit> {
    const deposit = this.depositRepository.create(createDepositDto);
    const saved = await this.depositRepository.save(deposit);

    await this.auditLogsService.create(
      'deposits',
      'create',
      'Deposit',
      saved.id,
      null,
      saved,
      operatorId,
      ip,
    );

    return saved;
  }

  async findAll(
    query: DepositQueryDto,
  ): Promise<{ items: Deposit[]; total: number; page: number; pageSize: number }> {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      leaseId,
      type,
      status,
      receiveDateFrom,
      receiveDateTo,
      source,
    } = query;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.depositRepository.createQueryBuilder('deposit');

    if (keyword) {
      queryBuilder.andWhere('deposit.depositNo LIKE :keyword', { keyword: `%${keyword}%` });
    }
    if (leaseId) {
      queryBuilder.andWhere('deposit.leaseId = :leaseId', { leaseId });
    }
    if (type) {
      queryBuilder.andWhere('deposit.type = :type', { type });
    }
    if (status) {
      queryBuilder.andWhere('deposit.status = :status', { status });
    }
    if (receiveDateFrom) {
      queryBuilder.andWhere('deposit.receiveDate >= :receiveDateFrom', { receiveDateFrom });
    }
    if (receiveDateTo) {
      queryBuilder.andWhere('deposit.receiveDate <= :receiveDateTo', { receiveDateTo });
    }
    if (source) {
      queryBuilder.andWhere('deposit.source = :source', { source });
    }

    queryBuilder.leftJoinAndSelect('deposit.lease', 'lease');
    queryBuilder.orderBy('deposit.createdAt', 'DESC');
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<Deposit> {
    const deposit = await this.depositRepository.findOne({
      where: { id },
      relations: ['lease'],
    });
    if (!deposit) {
      throw new NotFoundException(`Deposit with ID ${id} not found`);
    }
    return deposit;
  }

  async findByDepositNo(depositNo: string): Promise<Deposit | undefined> {
    return this.depositRepository.findOneBy({ depositNo });
  }

  async update(
    id: string,
    updateDepositDto: Partial<CreateDepositDto>,
    operatorId?: string,
    ip?: string,
  ): Promise<Deposit> {
    const deposit = await this.findOne(id);
    const oldValue = { ...deposit };

    Object.assign(deposit, updateDepositDto);
    const saved = await this.depositRepository.save(deposit);

    await this.auditLogsService.create(
      'deposits',
      'update',
      'Deposit',
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
    const deposit = await this.findOne(id);
    const oldValue = { ...deposit };

    const result = await this.depositRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Deposit with ID ${id} not found`);
    }

    await this.auditLogsService.create(
      'deposits',
      'delete',
      'Deposit',
      id,
      oldValue,
      null,
      operatorId,
      ip,
    );
  }
}
