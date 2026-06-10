import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CouponService } from './coupon.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@Controller('coupons')
export class CouponController {
  constructor(private couponService: CouponService) {}

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
    @Query('responsiblePerson') responsiblePerson?: string,
    @CurrentUser() user?: any,
  ) {
    const params: any = { page, pageSize, keyword, type, status, startDate, endDate, responsiblePerson };
    if (user.role === UserRole.STORE_GUIDE && user.storeId) {
      params.storeId = user.storeId;
    }
    return this.couponService.findAll(params);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats() {
    return this.couponService.getStats();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.couponService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: any) {
    return this.couponService.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() body: any) {
    return this.couponService.update(id, body);
  }

  @Put(':id/use')
  @UseGuards(AuthGuard('jwt'))
  async useCoupon(@Param('id') id: string, @Body() body: { orderNo: string }) {
    return this.couponService.useCoupon(id, body.orderNo);
  }
}
