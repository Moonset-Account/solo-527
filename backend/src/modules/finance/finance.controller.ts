import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('财务统计')
@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('profit-report')
  @ApiOperation({ summary: '利润报表' })
  async getProfitReport(@Query() query: any) {
    return this.financeService.getProfitReport(query);
  }

  @Get('payment-nodes')
  @ApiOperation({ summary: '付款节点列表' })
  async getPaymentNodes(@Query() query: any) {
    return this.financeService.getPaymentNodes(query);
  }

  @Post('payment-nodes/:id/paid')
  @ApiOperation({ summary: '标记付款完成' })
  async markPaymentPaid(@Param('id') id: string) {
    return this.financeService.markPaymentPaid(id);
  }

  @Get('monthly-trend')
  @ApiOperation({ summary: '月度趋势' })
  async getMonthlyTrend(@Query('months') months: number) {
    return this.financeService.getMonthlyTrend(months || 6);
  }
}
