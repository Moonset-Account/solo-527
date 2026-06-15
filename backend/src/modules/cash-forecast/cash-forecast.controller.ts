import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { CashForecastService } from './cash-forecast.service';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

@Controller('cash-forecasts')
export class CashForecastController {
  constructor(private readonly cashForecastService: CashForecastService) {}

  @Post()
  @AuditLog({ action: 'create', entityType: 'cash_forecast', description: 'Generate cash forecast' })
  generate(@Body() body: { period: string; openingBalance: number }) {
    return this.cashForecastService.generate(body.period, body.openingBalance);
  }

  @Get()
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 50) {
    return this.cashForecastService.findAll(page, limit);
  }

  @Get('trend')
  getTrend(@Query('months') months: number = 6) {
    return this.cashForecastService.getTrend(months);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashForecastService.findOne(id);
  }

  @Put(':id/actuals')
  @AuditLog({ action: 'update_actuals', entityType: 'cash_forecast', description: 'Update forecast actuals' })
  updateActuals(@Param('id') id: string, @Body() actualData: any) {
    return this.cashForecastService.updateActuals(id, actualData);
  }

  @Put(':id/status')
  @AuditLog({ action: 'update_status', entityType: 'cash_forecast', description: 'Update forecast status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.cashForecastService.updateStatus(id, body.status as any);
  }
}
