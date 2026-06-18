import { Controller, Get, UseGuards, Delete } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: any) {
    return this.service.getOverview(user);
  }

  @Get('todo')
  getTodoList(@CurrentUser() user: any) {
    return this.service.getTodoList(user.sub);
  }

  @Get()
  getDashboard(@CurrentUser() user: any) {
    return this.service.getDashboardData(user);
  }

  @Delete('cache')
  @Roles('admin')
  clearCache() {
    return this.service.clearCache();
  }
}
