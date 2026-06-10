import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReachLogService } from './reach-log.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reach-logs')
export class ReachLogController {
  constructor(private reachLogService: ReachLogService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('envLabel') envLabel?: string,
    @Query('operatorName') operatorName?: string,
    @CurrentUser() user?: any,
  ) {
    const params: any = { page, pageSize, keyword, type, status, startDate, endDate, envLabel, operatorName };
    if (user.role === UserRole.STORE_GUIDE && user.storeId) {
      params.storeId = user.storeId;
    }
    return this.reachLogService.findAll(params);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats() {
    return this.reachLogService.getStats();
  }

  @Get('failed')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)
  async getFailedLogs(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reachLogService.getFailedLogs({ page, pageSize, startDate, endDate });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.reachLogService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: any, @CurrentUser() user: any) {
    return this.reachLogService.create({
      ...body,
      operatorId: user._id,
      operatorName: user.name,
    });
  }

  @Put(':id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateStatus(@Param('id') id: string, @Body() body: { status: string; [key: string]: any }) {
    const { status, ...rest } = body;
    return this.reachLogService.updateStatus(id, status as any, rest);
  }
}
