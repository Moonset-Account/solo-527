import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { OperationLogsService } from './operation-logs.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('operation-logs')
export class OperationLogsController {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.operationLogsService.findAll(query);
  }

  @Get('recent')
  getRecentLogs(@Query('limit') limit: string) {
    return this.operationLogsService.getRecentLogs(parseInt(limit, 10) || 20);
  }

  @Get('module/:module')
  getLogsByModule(@Param('module') module: string, @Query('limit') limit: string) {
    return this.operationLogsService.getLogsByModule(module, parseInt(limit, 10) || 50);
  }

  @Get('stats')
  getStats(@Query('days') days: string) {
    return this.operationLogsService.getStats(parseInt(days, 10) || 7);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.operationLogsService.findById(id);
  }
}
