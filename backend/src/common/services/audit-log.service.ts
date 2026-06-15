import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@/database/entities';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(filters: any = {}, page: number = 1, limit: number = 50): Promise<{ data: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');

    if (filters.entityType) {
      queryBuilder.andWhere('audit_log.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit_log.action = :action', { action: filters.action });
    }

    if (filters.entityId) {
      queryBuilder.andWhere('audit_log.entityId = :entityId', { entityId: filters.entityId });
    }

    if (filters.userId) {
      queryBuilder.andWhere('audit_log.userId = :userId', { userId: filters.userId });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate: filters.endDate });
    }

    queryBuilder.orderBy('audit_log.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({ where: { id } });
  }
}
