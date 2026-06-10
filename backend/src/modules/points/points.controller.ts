import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PointsService } from './points.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@Controller('points')
export class PointsController {
  constructor(private pointsService: PointsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('memberId') memberId?: string,
    @CurrentUser() user?: any,
  ) {
    const params: any = { page, pageSize, keyword, type, startDate, endDate, memberId };
    if (user.role === UserRole.STORE_GUIDE && user.storeId) {
      params.storeId = user.storeId;
    }
    return this.pointsService.findAll(params);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats() {
    return this.pointsService.getStats();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.pointsService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: any) {
    return this.pointsService.create(body);
  }
}
