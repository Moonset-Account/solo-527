import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Exception } from '../../schemas/exception.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('仪表盘')
@ApiBearerAuth()
@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: '获取首页统计数据' })
  @ApiResponse({ status: 200, description: '统计数据' })
  async getStats(@CurrentUser() user: CurrentUserPayload): Promise<{
    todayFollowups: number;
    pendingLeads: number;
    pendingExceptions: number;
  }> {
    return this.dashboardService.getStats(user);
  }

  @Get('today-tasks')
  @ApiOperation({ summary: '获取今日待办列表' })
  @ApiResponse({ status: 200, description: '今日待办列表' })
  async getTodayTasks(@CurrentUser() user: CurrentUserPayload): Promise<any[]> {
    return this.dashboardService.getTodayTasks(user);
  }

  @Get('exceptions')
  @ApiOperation({ summary: '获取异常记录' })
  @ApiResponse({ status: 200, type: [Exception] })
  async getExceptions(): Promise<Exception[]> {
    return this.dashboardService.getExceptions();
  }
}
