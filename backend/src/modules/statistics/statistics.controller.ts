import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  getOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getOverview(startDate, endDate);
  }

  @Get('processing-records')
  getProcessingRecords(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query() filters: any,
  ) {
    return this.statisticsService.getProcessingRecords(page, pageSize, filters);
  }

  @Get('appointments-by-counselor')
  getAppointmentStatsByCounselor(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getAppointmentStatsByCounselor(startDate, endDate);
  }

  @Get('refund-stats')
  getRefundStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getRefundStats(startDate, endDate);
  }

  @Get('recent-records')
  getRecentRecords(@Query('limit') limit: number) {
    return this.statisticsService.getRecentRecords(limit || 20);
  }

  @Get('waitlist-stats')
  getWaitlistStats() {
    return this.statisticsService.getWaitlistStats();
  }

  @Get('cross-dept-report')
  getCrossDeptReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getCrossDeptReport(startDate, endDate);
  }
}
