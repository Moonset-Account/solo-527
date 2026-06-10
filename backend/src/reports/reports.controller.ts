import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('material-cost')
  getMaterialCostReport(
    @Query('projectId') projectId?: string,
    @Query('month') month?: string,
  ) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    return this.reportsService.getMaterialCostReport(projectIdNum, month);
  }

  @Get('project-summary')
  getProjectSummary(@Query('projectId', ParseIntPipe) projectId: number) {
    return this.reportsService.getProjectSummary(projectId);
  }

  @Get('monthly-summary')
  getMonthlySummary(@Query('month') month: string) {
    return this.reportsService.getMonthlySummary(month);
  }
}
