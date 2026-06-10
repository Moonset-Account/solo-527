import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RedeemService } from './redeem.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@Controller('redeems')
export class RedeemController {
  constructor(private redeemService: RedeemService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('operatorName') operatorName?: string,
    @Query('memberId') memberId?: string,
    @CurrentUser() user?: any,
  ) {
    const params: any = { page, pageSize, keyword, status, startDate, endDate, operatorName, memberId };
    if (user.role === UserRole.STORE_GUIDE && user.storeId) {
      params.storeId = user.storeId;
    }
    return this.redeemService.findAll(params);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats() {
    return this.redeemService.getStats();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.redeemService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: any) {
    return this.redeemService.create(body);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateStatus(@Param('id') id: string, @Body() body: { status: string; failReason?: string }) {
    return this.redeemService.updateStatus(id, body.status as any, body.failReason);
  }
}
