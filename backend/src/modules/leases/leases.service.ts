import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lease } from './entities/lease.entity';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { LeaseQueryDto } from './dto/lease-query.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class LeasesService {
  constructor(
    @InjectRepository(Lease)
    private leaseRepository: Repository<Lease>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(
    createLeaseDto: CreateLeaseDto,
    operatorId?: string,
    ip?: string,
  ): Promise<Lease> {
    const lease = this.leaseRepository.create({
      ...createLeaseDto,
      createdBy: operatorId,
    });
    const saved = await this.leaseRepository.save(lease);

    await this.auditLogsService.create(
      'leases',
      'create',
      'Lease',
      saved.id,
      null,
      saved,
      operatorId,
      ip,
    );

    return saved;
  }

  async findAll(
    query: LeaseQueryDto,
  ): Promise<{ items: Lease[]; total: number; page: number; pageSize: number }> {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      propertyId,
      status,
      startDateFrom,
      endDateTo,
      source,
    } = query;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.leaseRepository.createQueryBuilder('lease');

    if (keyword) {
      queryBuilder.andWhere(
        '(lease.leaseNo LIKE :keyword OR lease.tenantName LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (propertyId) {
      queryBuilder.andWhere('lease.propertyId = :propertyId', { propertyId });
    }
    if (status) {
      queryBuilder.andWhere('lease.status = :status', { status });
    }
    if (startDateFrom) {
      queryBuilder.andWhere('lease.startDate >= :startDateFrom', { startDateFrom });
    }
    if (endDateTo) {
      queryBuilder.andWhere('lease.endDate <= :endDateTo', { endDateTo });
    }
    if (source) {
      queryBuilder.andWhere('lease.source = :source', { source });
    }

    queryBuilder.leftJoinAndSelect('lease.property', 'property');
    queryBuilder.leftJoinAndSelect('lease.creator', 'creator');
    queryBuilder.orderBy('lease.createdAt', 'DESC');
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<Lease> {
    const lease = await this.leaseRepository.findOne({
      where: { id },
      relations: ['property', 'creator'],
    });
    if (!lease) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }
    return lease;
  }

  async findByLeaseNo(leaseNo: string): Promise<Lease | undefined> {
    return this.leaseRepository.findOneBy({ leaseNo });
  }

  async update(
    id: string,
    updateLeaseDto: UpdateLeaseDto,
    operatorId?: string,
    ip?: string,
  ): Promise<Lease> {
    const lease = await this.findOne(id);
    const oldValue = { ...lease };

    Object.assign(lease, updateLeaseDto);
    const saved = await this.leaseRepository.save(lease);

    await this.auditLogsService.create(
      'leases',
      'update',
      'Lease',
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
    const lease = await this.findOne(id);
    const oldValue = { ...lease };

    const result = await this.leaseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }

    await this.auditLogsService.create(
      'leases',
      'delete',
      'Lease',
      id,
      oldValue,
      null,
      operatorId,
      ip,
    );
  }
}
