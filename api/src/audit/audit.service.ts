import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity.js';
import type { TargetType } from '../../../shared/types.js';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    operatorId: number | undefined,
    action: string,
    targetType: TargetType,
    targetId: number,
    beforeData: Record<string, unknown> | null = null,
    afterData: Record<string, unknown> | null = null,
    isFailed: boolean = false,
    failReason: string | null = null,
  ) {
    const logEntry = this.auditLogRepository.create({
      operator: operatorId ? ({ id: operatorId } as any) : null,
      action,
      targetType,
      targetId,
      beforeData,
      afterData,
      isFailed,
      failReason,
    });
    return this.auditLogRepository.save(logEntry);
  }

  async findAll(query: {
    operatorId?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { operatorId, type, startDate, endDate, page = 1, pageSize = 10 } = query;
    const qb = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.operator', 'operator');

    if (operatorId) {
      qb.andWhere('log.operator_id = :operatorId', { operatorId });
    }
    if (type) {
      qb.andWhere('log.target_type = :type', { type });
    }
    if (startDate) {
      qb.andWhere('log.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('log.created_at <= :endDate', { endDate });
    }

    qb.orderBy('log.created_at', 'DESC');
    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { items, total, page, pageSize };
  }
}
