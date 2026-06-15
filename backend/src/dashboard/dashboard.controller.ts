import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('timeliness')
  async getTimeliness() {
    return this.dashboardService.getTimeliness();
  }

  @Get('todo')
  async getTodo(@CurrentUser() user: any) {
    return this.dashboardService.getTodo(user.id, user.displayName);
  }
}
