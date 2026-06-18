import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { OperationLog } from './operation-log.entity';
import { DateUtils } from '../../common/utils/date.utils';

@Injectable()
export class OperationLogsService {
  constructor(
    @InjectRepository(OperationLog)
    private operationLogRepository: Repository<OperationLog>,
  ) {}

  async findAll(
    startDate?: string,
    endDate?: string,
    operatorId?: string,
    action?: string,
    targetType?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: OperationLog[]; total: number }> {
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = Between(
        DateUtils.parseStartOfDay(startDate),
        DateUtils.parseEndOfDay(endDate),
      );
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }
    if (action) {
      where.action = action;
    }
    if (targetType) {
      where.targetType = targetType;
    }

    const [data, total] = await this.operationLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  log(
    operatorId: string | null,
    operatorName: string,
    action: string,
    targetType: string,
    targetId: string | null,
    details?: Record<string, any>,
    ipAddress?: string,
  ): Promise<OperationLog> {
    const log = this.operationLogRepository.create({
      operatorId,
      operatorName,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
    });
    return this.operationLogRepository.save(log);
  }
}
