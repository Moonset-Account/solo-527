import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiRequestLog } from '../entities/api-request-log.entity';
import { ApiLogService } from './api-log.service';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { OperationLogService } from './operation-log.service';
import { v4 as uuidv4 } from 'uuid';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApiRetryService {
  private readonly logger = new Logger(ApiRetryService.name);

  constructor(
    @InjectRepository(ApiRequestLog)
    private readonly apiRequestLogRepository: Repository<ApiRequestLog>,
    private readonly apiLogService: ApiLogService,
    private readonly operationLogService: OperationLogService,
    private readonly httpService: HttpService,
  ) {}

  async retryRequest(requestId: string, operator: CurrentUserPayload) {
    const originalRequest = await this.apiRequestLogRepository.findOne({
      where: { id: requestId },
    });

    if (!originalRequest) {
      throw new NotFoundException('请求记录不存在');
    }

    if (originalRequest.isSuccess) {
      throw new BadRequestException('该请求已成功，无需重试');
    }

    if (originalRequest.retryCount >= originalRequest.maxRetries) {
      throw new BadRequestException('已达到最大重试次数');
    }

    if (!originalRequest.isRetryable) {
      throw new BadRequestException('该请求不可重试');
    }

    const attemptNumber = originalRequest.retryCount + 1;
    const newRequestId = uuidv4();
    const startTime = Date.now();
    const delayMs = this.calculateDelay(attemptNumber);

    await this.apiLogService.incrementRetryCount(originalRequest.requestId);

    await this.operationLogService.createLog({
      module: '接口重试',
      action: '发起接口重试',
      targetType: 'ApiRequestLog',
      targetId: requestId,
      newValue: {
        attemptNumber,
        method: originalRequest.method,
        url: originalRequest.url,
      },
      user: operator,
    });

    let retrySuccess = false;
    let errorMessage: string | undefined;
    let statusCode: number | undefined;

    try {
      await this.delay(delayMs);

      const headers: Record<string, string> = {};
      if (operator.id) {
        headers['x-user-id'] = operator.id;
      }

      let body: any;
      if (originalRequest.requestBody) {
        try {
          body = JSON.parse(originalRequest.requestBody);
        } catch {
          body = originalRequest.requestBody;
        }
      }

      let response;
      const config = {
        url: originalRequest.url,
        method: originalRequest.method as any,
        headers,
        data: body,
        timeout: 30000,
      };

      this.logger.log(`Retrying request (attempt ${attemptNumber}): ${originalRequest.method} ${originalRequest.url}`);

      response = await firstValueFrom(this.httpService.request(config));
      statusCode = response.status;
      retrySuccess = statusCode >= 200 && statusCode < 400;

      if (!retrySuccess) {
        errorMessage = `HTTP ${statusCode}`;
      }
    } catch (error: any) {
      statusCode = error.response?.status || 0;
      errorMessage = error.message || 'Unknown error';
      this.logger.error(`Retry failed (attempt ${attemptNumber}): ${errorMessage}`);
    }

    const duration = Date.now() - startTime;

    await this.apiLogService.createRetryLog({
      originalRequestId: originalRequest.requestId,
      requestId: newRequestId,
      attemptNumber,
      method: originalRequest.method,
      url: originalRequest.url,
      statusCode,
      isSuccess: retrySuccess,
      errorMessage,
      delayMs,
      duration,
    });

    if (retrySuccess) {
      await this.apiLogService.updateRequestLog(originalRequest.id, {
        isSuccess: true,
      });
    }

    await this.operationLogService.createLog({
      module: '接口重试',
      action: retrySuccess ? '接口重试成功' : '接口重试失败',
      targetType: 'ApiRequestLog',
      targetId: requestId,
      oldValue: { isSuccess: originalRequest.isSuccess },
      newValue: {
        attemptNumber,
        isSuccess: retrySuccess,
        statusCode,
        errorMessage,
      },
      user: operator,
    });

    return {
      success: retrySuccess,
      attemptNumber,
      statusCode,
      errorMessage,
      duration,
      delayMs,
    };
  }

  async retryAllFailed(operator: CurrentUserPayload) {
    const failedRequests = await this.apiRequestLogRepository
      .createQueryBuilder('log')
      .where('log.is_success = false')
      .andWhere('log.is_retryable = true')
      .andWhere('log.retry_count < log.max_retries')
      .getMany();

    const results = [];
    for (const request of failedRequests) {
      try {
        const result = await this.retryRequest(request.id, operator);
        results.push({ requestId: request.id, ...result });
      } catch (error: any) {
        results.push({
          requestId: request.id,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: failedRequests.length,
      successCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results,
    };
  }

  async getRetryStats() {
    const totalFailed = await this.apiRequestLogRepository.count({
      where: { isSuccess: false },
    });

    const retryable = await this.apiRequestLogRepository
      .createQueryBuilder('log')
      .where('log.is_success = false')
      .andWhere('log.is_retryable = true')
      .andWhere('log.retry_count < log.max_retries')
      .getCount();

    const maxRetryReached = await this.apiRequestLogRepository
      .createQueryBuilder('log')
      .where('log.is_success = false')
      .andWhere('log.retry_count >= log.max_retries')
      .getCount();

    const totalRetries = await this.apiRequestLogRepository
      .createQueryBuilder('log')
      .select('SUM(log.retry_count)', 'total')
      .where('log.retry_count > 0')
      .getRawOne();

    return {
      totalFailed,
      retryable,
      maxRetryReached,
      totalRetries: parseInt(totalRetries?.total || '0', 10),
    };
  }

  private calculateDelay(attemptNumber: number): number {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = baseDelay * Math.pow(2, attemptNumber - 1);
    return Math.min(delay, maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
