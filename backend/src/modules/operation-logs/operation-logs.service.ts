import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { OperationLog, OperationType } from '../../entities/operation-log.entity';

export interface QueryOperationLogsDto {
  page?: number;
  pageSize?: number;
  module?: string;
  operationType?: OperationType;
  operatorId?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
}

@Injectable()
export class OperationLogsService {
  constructor(
    @InjectRepository(OperationLog)
    private operationLogsRepository: Repository<OperationLog>,
  ) {}

  async findAll(query: QueryOperationLogsDto) {
    const { page = 1, pageSize = 10, module, operationType, operatorId, startDate, endDate, date } = query;
    const where: any = {};

    if (module) {
      where.module = module;
    }
    if (operationType) {
      where.operationType = operationType;
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      where.createdAt = Between(dayStart, dayEnd);
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = Between(start, end);
    }

    const [data, total] = await this.operationLogsRepository.findAndCount({
      where,
      relations: ['operator'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data,
      total,
      page,
      pageSize,
    };
  }
}
