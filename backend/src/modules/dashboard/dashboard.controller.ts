import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('后台看板')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '看板概览数据' })
  async getOverview(@Query() query: any) {
    return this.dashboardService.getOverview(query);
  }

  @Get('overdue-tasks')
  @ApiOperation({ summary: '超时任务列表' })
  async getOverdueTasks(@Query() query: any) {
    return this.dashboardService.getOverdueTasks(query);
  }

  @Get('resource-utilization')
  @ApiOperation({ summary: '资源利用率' })
  async getResourceUtilization() {
    return this.dashboardService.getResourceUtilization();
  }

  @Get('process-stuck')
  @ApiOperation({ summary: '流程卡点分析' })
  async getProcessStuck() {
    return this.dashboardService.getProcessStuck();
  }
}
