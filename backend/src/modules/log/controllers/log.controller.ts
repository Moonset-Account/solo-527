import { Controller, Get, Query, Post, Body, Param, Put } from '@nestjs/common';
import { OperationLogService } from '../services/operation-log.service';
import { ApiLogService } from '../services/api-log.service';
import { ApiRetryService } from '../services/api-retry.service';
import { RequiresPermission } from '../../../common/decorators/requires-permission.decorator';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Controller('logs')
export class LogController {
  constructor(
    private readonly operationLogService: OperationLogService,
    private readonly apiLogService: ApiLogService,
    private readonly apiRetryService: ApiRetryService,
  ) {}

  @Get('operation')
  @RequiresPermission('log:view')
  async getOperationLogs(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.operationLogService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      module,
      action,
      userId,
      status,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });
  }

  @Get('api/failed')
  @RequiresPermission('api_log:view')
  async getFailedRequests(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('isRetryable') isRetryable?: string,
    @Query('maxRetryReached') maxRetryReached?: string,
  ) {
    return this.apiLogService.findFailedRequests({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      isRetryable: isRetryable !== undefined ? isRetryable === 'true' : undefined,
      maxRetryReached: maxRetryReached !== undefined ? maxRetryReached === 'true' : undefined,
    });
  }

  @Get('api/:id')
  @RequiresPermission('api_log:view')
  async getRequestDetail(@Param('id') id: string) {
    return this.apiLogService.getRequestById(id);
  }

  @Get('api/:id/retries')
  @RequiresPermission('api_retry:view')
  async getRetryLogs(@Param('id') originalRequestId: string) {
    return this.apiLogService.getRetryLogs(originalRequestId);
  }

  @Post('api/:id/retry')
  @RequiresPermission('api_retry:execute')
  async retryRequest(
    @Param('id') requestId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.apiRetryService.retryRequest(requestId, user);
  }

  @Post('api/retry-all')
  @RequiresPermission('api_retry:execute')
  async retryAllFailed(@CurrentUser() user: CurrentUserPayload) {
    return this.apiRetryService.retryAllFailed(user);
  }

  @Get('api/retry/stats')
  @RequiresPermission('api_retry:view')
  async getRetryStats() {
    return this.apiRetryService.getRetryStats();
  }
}
