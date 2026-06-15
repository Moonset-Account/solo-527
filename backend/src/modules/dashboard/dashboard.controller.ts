import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('aging-report')
  getAgingReport() {
    return this.dashboardService.getAgingReport();
  }

  @Get('monthly-trend')
  getMonthlyTrend(@Query('months') months: number = 6) {
    return this.dashboardService.getMonthlyTrend(months);
  }
}
