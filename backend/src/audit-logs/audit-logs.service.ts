import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

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

  async findAll(query: QueryAuditLogsDto) {
    const { page, limit, sortOrder, entityType, action, operator } = query;
    const queryBuilder = this.auditLogRepository.createQueryBuilder('log');

    if (entityType) {
      queryBuilder.andWhere('log.entityType = :entityType', { entityType });
    }
    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }
    if (operator) {
      queryBuilder.andWhere('log.operator = :operator', { operator });
    }

    queryBuilder.orderBy('log.createdAt', sortOrder);
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();
    return { data: items, total, page, limit };
  }
}
