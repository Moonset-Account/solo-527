import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('help-progress')
  getHelpProgressReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    return this.reportService.getHelpProgressReport(startDate, endDate);
  }

  @Get('event-closure')
  getEventClosureStats(): Promise<any> {
    return this.reportService.getEventClosureStats();
  }

  @Get('performance')
  getPerformanceByUser(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any[]> {
    return this.reportService.getPerformanceByUser(startDate, endDate);
  }

  @Get('vote-participation')
  getVoteParticipationStats(): Promise<any> {
    return this.reportService.getVoteParticipationStats();
  }

  @Get('shift-stats')
  getShiftStats(): Promise<any> {
    return this.reportService.getShiftStats();
  }
}
