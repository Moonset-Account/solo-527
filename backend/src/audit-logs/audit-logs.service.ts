import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(logData: Partial<AuditLog>) {
    const log = this.auditLogRepository.create(logData);
    return this.auditLogRepository.save(log);
  }

  async findAll(pagination: PaginationDto, entityType?: string, action?: string, operator?: string) {
    const query = this.auditLogRepository.createQueryBuilder('log');

    if (entityType) {
      query.andWhere('log.entityType = :entityType', { entityType });
    }
    if (action) {
      query.andWhere('log.action = :action', { action });
    }
    if (operator) {
      query.andWhere('log.operator = :operator', { operator });
    }

    query.orderBy('log.createdAt', pagination.sortOrder);
    query.skip((pagination.page - 1) * pagination.limit);
    query.take(pagination.limit);

    const [items, total] = await query.getManyAndCount();
    return { items, total, page: pagination.page, limit: pagination.limit };
  }
}
