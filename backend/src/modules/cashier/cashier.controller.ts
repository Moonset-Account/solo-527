import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CashierService } from './cashier.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('cashier')
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  @Post()
  create(
    @Body() createCashierDto: any,
    @CurrentUser('_id') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.cashierService.create(createCashierDto, userId, userName);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.cashierService.findAll(query);
  }

  @Get('daily-stats')
  getDailyStats(@Query('date') date: string) {
    return this.cashierService.getDailyStats(date || new Date().toISOString().split('T')[0]);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashierService.findById(id);
  }

  @Get('order/:orderNo')
  findByOrderNo(@Param('orderNo') orderNo: string) {
    return this.cashierService.findByOrderNo(orderNo);
  }

  @Post(':id/refund')
  refund(
    @Param('id') id: string,
    @Body() body: { refundAmount: number },
    @CurrentUser('_id') userId: string,
  ) {
    return this.cashierService.refund(id, body.refundAmount, userId);
  }
}
