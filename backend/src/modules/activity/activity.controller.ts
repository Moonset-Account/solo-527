import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActivityService } from './activity.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@Controller('activities')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get('summary')
  @UseGuards(AuthGuard('jwt'))
  async getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    const params: any = { startDate, endDate };
    if (user.role === UserRole.STORE_GUIDE && user.storeId) {
      params.storeId = user.storeId;
    }
    return this.activityService.getSummary(params);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
    @Query('type') type?: string,
    @Query('memberId') memberId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    const params: any = { page, pageSize, keyword, type, memberId, startDate, endDate };
    if (user.role === UserRole.STORE_GUIDE && user.storeId) {
      params.storeId = user.storeId;
    }
    return this.activityService.findAll(params);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.activityService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: any) {
    return this.activityService.create(body);
  }
}
