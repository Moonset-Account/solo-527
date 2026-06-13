import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('status')
  getStatusStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('assignee') assignee?: string,
  ) {
    return this.statsService.getStatusStats(startDate, endDate, assignee);
  }

  @Get('trend')
  getTrendStats(@Query('days') days: number = 7) {
    return this.statsService.getTrendStats(Number(days));
  }

  @Get('assignee')
  getAssigneeStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statsService.getAssigneeStats(startDate, endDate);
  }
}
