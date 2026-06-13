import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog } from '../entities/operation-log.entity';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class OperationLogService {
  private readonly logger = new Logger(OperationLogService.name);

  constructor(
    @InjectRepository(OperationLog)
    private readonly operationLogRepository: Repository<OperationLog>,
  ) {}

  async createLog(params: {
    module: string;
    action: string;
    targetType?: string;
    targetId?: string;
    oldValue?: any;
    newValue?: any;
    status?: 'success' | 'failed' | 'warning';
    errorMessage?: string;
    user?: CurrentUserPayload;
    ip?: string;
    userAgent?: string;
  }) {
    try {
      const log = this.operationLogRepository.create({
        module: params.module,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        oldValue: params.oldValue,
        newValue: params.newValue,
        status: params.status || 'success',
        errorMessage: params.errorMessage,
        userId: params.user?.id,
        clinicId: params.user?.clinicId,
        ipAddress: params.ip,
        userAgent: params.userAgent,
      });
      return await this.operationLogRepository.save(log);
    } catch (error: any) {
      this.logger.error('记录操作日志失败', error);
      return null;
    }
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    module?: string;
    action?: string;
    userId?: string;
    status?: string;
    startTime?: Date;
    endTime?: Date;
  }) {
    const { page = 1, pageSize = 20, ...filters } = params;
    const queryBuilder = this.operationLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user');

    if (filters.module) {
      queryBuilder.andWhere('log.module = :module', { module: filters.module });
    }
    if (filters.action) {
      queryBuilder.andWhere('log.action = :action', { action: filters.action });
    }
    if (filters.userId) {
      queryBuilder.andWhere('log.user_id = :userId', { userId: filters.userId });
    }
    if (filters.status) {
      queryBuilder.andWhere('log.status = :status', { status: filters.status });
    }
    if (filters.startTime) {
      queryBuilder.andWhere('log.created_at >= :startTime', { startTime: filters.startTime });
    }
    if (filters.endTime) {
      queryBuilder.andWhere('log.created_at <= :endTime', { endTime: filters.endTime });
    }

    const [items, total] = await queryBuilder
      .orderBy('log.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }
}
