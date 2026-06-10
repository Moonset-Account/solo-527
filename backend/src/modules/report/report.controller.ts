import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportService } from './report.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reports')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get('overview')
  @UseGuards(AuthGuard('jwt'))
  async getOverview(
    @Query('envLabel') envLabel?: string,
    @CurrentUser() user?: any,
  ) {
    const params: any = { envLabel };
    if (user.role === UserRole.STORE_GUIDE && user.storeId) {
      params.storeId = user.storeId;
    }
    return this.reportService.getOverview(params);
  }

  @Get('member-growth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)
  async getMemberGrowth(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    const params: any = { startDate, endDate };
    if (user.role === UserRole.STORE_GUIDE && user.storeId) {
      params.storeId = user.storeId;
    }
    return this.reportService.getMemberGrowth(params);
  }

  @Get('reach')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)
  async getReachReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('envLabel') envLabel?: string,
    @Query('type') type?: string,
    @CurrentUser() user?: any,
  ) {
    const params: any = { startDate, endDate, envLabel, type };
    if (user.role === UserRole.STORE_GUIDE && user.storeId) {
      params.storeId = user.storeId;
    }
    return this.reportService.getReachReport(params);
  }
}
