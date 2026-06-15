import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogService } from './log.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { LogType } from '../../common/types/index.js';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: LogType,
    @Query('operator') operator?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      type,
      operator,
      startDate,
      endDate,
    });
  }
}
