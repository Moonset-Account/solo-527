import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@/database/entities';
import { CreateAuditLogDto, AuditLogFilterDto, EntityType, ActionType } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(createAuditLogDto);
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(filters: AuditLogFilterDto): Promise<{ data: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');

    if (filters.entityType) {
      queryBuilder.andWhere('audit_log.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.entityId) {
      queryBuilder.andWhere('audit_log.entityId = :entityId', { entityId: filters.entityId });
    }

    if (filters.userId) {
      queryBuilder.andWhere('audit_log.userId = :userId', { userId: filters.userId });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit_log.action = :action', { action: filters.action });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const sortBy = filters.sortBy || 'audit_log.createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(sortBy, sortOrder as 'ASC' | 'DESC');

    queryBuilder.skip((filters.page - 1) * filters.limit);
    queryBuilder.take(filters.limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<AuditLog> {
    const auditLog = await this.auditLogRepository.findOne({ where: { id } });
    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }
    return auditLog;
  }

  async findByEntity(entityType: EntityType, entityId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async exportLogs(filters: AuditLogFilterDto): Promise<string> {
    const allFilters = { ...filters, page: 1, limit: 10000 };
    const { data } = await this.findAll(allFilters);

    const headers = [
      'ID',
      '操作类型',
      '实体类型',
      '实体ID',
      '用户ID',
      '用户名',
      '描述',
      '变更字段',
      'IP地址',
      'User Agent',
      '创建时间',
    ];

    const rows = data.map(log => [
      log.id,
      this.translateAction(log.action as ActionType),
      this.translateEntityType(log.entityType as EntityType),
      log.entityId,
      log.userId || '',
      log.username || '',
      log.description || '',
      log.changedFields ? log.changedFields.join(', ') : '',
      log.ipAddress || '',
      log.userAgent || '',
      log.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return '\uFEFF' + csvContent;
  }

  private translateAction(action: ActionType): string {
    const actionMap: Record<ActionType, string> = {
      create: '创建',
      update: '更新',
      delete: '删除',
      update_status: '更新状态',
      record_payment: '记录付款',
      export: '导出',
      import: '导入',
      login: '登录',
      logout: '登出',
    };
    return actionMap[action] || action;
  }

  private translateEntityType(entityType: EntityType): string {
    const entityMap: Record<EntityType, string> = {
      bill: '账单',
      collection_rhythm: '催收节奏',
      collection_record: '催收记录',
      invoice: '发票',
      attachment: '附件',
      reconciliation: '对账',
      cash_forecast: '现金流预测',
      customer: '客户',
      subscription: '订阅',
      export_queue: '导出队列',
    };
    return entityMap[entityType] || entityType;
  }
}
