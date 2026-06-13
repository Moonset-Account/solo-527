import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ApiRequestLog } from '../entities/api-request-log.entity';
import { ApiRetryLog } from '../entities/api-retry-log.entity';

@Injectable()
export class ApiLogService {
  private readonly logger = new Logger(ApiLogService.name);

  constructor(
    @InjectRepository(ApiRequestLog)
    private readonly apiRequestLogRepository: Repository<ApiRequestLog>,
    @InjectRepository(ApiRetryLog)
    private readonly apiRetryLogRepository: Repository<ApiRetryLog>,
  ) {}

  generateRequestId(): string {
    return uuidv4();
  }

  async createRequestLog(params: {
    method: string;
    url: string;
    headers?: any;
    requestBody?: string;
    userId?: string;
    ipAddress?: string;
    maxRetries?: number;
  }): Promise<ApiRequestLog> {
    const log = this.apiRequestLogRepository.create({
      requestId: params.maxRetries ? uuidv4() : uuidv4(),
      method: params.method,
      url: params.url,
      headers: params.headers,
      requestBody: params.requestBody,
      userId: params.userId,
      ipAddress: params.ipAddress,
      maxRetries: params.maxRetries || 3,
    });
    return await this.apiRequestLogRepository.save(log);
  }

  async updateRequestLog(
    id: string,
    params: {
      responseBody?: string;
      statusCode?: number;
      duration?: number;
      isSuccess?: boolean;
      errorMessage?: string;
      errorStack?: string;
      isRetryable?: boolean;
    },
  ): Promise<void> {
    await this.apiRequestLogRepository.update(id, params);
  }

  async incrementRetryCount(requestId: string): Promise<void> {
    await this.apiRequestLogRepository.increment({ requestId }, 'retryCount', 1);
  }

  async createRetryLog(params: {
    originalRequestId: string;
    requestId: string;
    attemptNumber: number;
    method: string;
    url: string;
    statusCode?: number;
    isSuccess?: boolean;
    errorMessage?: string;
    delayMs?: number;
    duration?: number;
  }): Promise<ApiRetryLog> {
    const log = this.apiRetryLogRepository.create(params);
    return await this.apiRetryLogRepository.save(log);
  }

  async findFailedRequests(params: {
    page?: number;
    pageSize?: number;
    isRetryable?: boolean;
    maxRetryReached?: boolean;
  }) {
    const { page = 1, pageSize = 20, isRetryable, maxRetryReached } = params;
    const queryBuilder = this.apiRequestLogRepository
      .createQueryBuilder('log')
      .where('log.is_success = false');

    if (isRetryable !== undefined) {
      queryBuilder.andWhere('log.is_retryable = :isRetryable', { isRetryable });
    }

    if (maxRetryReached !== undefined) {
      if (maxRetryReached) {
        queryBuilder.andWhere('log.retry_count >= log.max_retries');
      } else {
        queryBuilder.andWhere('log.retry_count < log.max_retries');
      }
    }

    const [items, total] = await queryBuilder
      .leftJoinAndSelect('log.retryLogs', 'retryLogs')
      .orderBy('log.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }

  async getRetryLogs(originalRequestId: string) {
    return await this.apiRetryLogRepository.find({
      where: { originalRequestId },
      order: { createdAt: 'DESC' },
    });
  }

  async getRequestById(id: string): Promise<ApiRequestLog | null> {
    return await this.apiRequestLogRepository.findOne({
      where: { id },
      relations: ['retryLogs'],
    });
  }
}
