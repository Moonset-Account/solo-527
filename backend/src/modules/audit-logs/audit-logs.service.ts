import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(
    module: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValue?: Record<string, any>,
    newValue?: Record<string, any>,
    operatorId?: string,
    ip?: string,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      module,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      operatorId,
      ip,
    });
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(query: AuditLogQueryDto): Promise<{ items: AuditLog[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 10, module, action, entityType, entityId, operatorId } = query;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.auditLogRepository.createQueryBuilder('auditLog');

    if (module) {
      queryBuilder.andWhere('auditLog.module = :module', { module });
    }
    if (action) {
      queryBuilder.andWhere('auditLog.action = :action', { action });
    }
    if (entityType) {
      queryBuilder.andWhere('auditLog.entityType = :entityType', { entityType });
    }
    if (entityId) {
      queryBuilder.andWhere('auditLog.entityId = :entityId', { entityId });
    }
    if (operatorId) {
      queryBuilder.andWhere('auditLog.operatorId = :operatorId', { operatorId });
    }

    queryBuilder.orderBy('auditLog.createdAt', 'DESC');
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<AuditLog> {
    return this.auditLogRepository.findOneBy({ id });
  }
}
