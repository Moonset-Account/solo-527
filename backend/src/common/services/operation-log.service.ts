import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog } from '../../modules/operation-logs/operation-log.entity';

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLog)
    private operationLogRepository: Repository<OperationLog>,
  ) {}

  async log(
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
