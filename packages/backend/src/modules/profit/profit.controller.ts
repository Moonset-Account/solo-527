import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ProfitService } from './profit.service';
import { StatPeriod } from '../../entities/profit-stat.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('profit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfitController {
  constructor(private profitService: ProfitService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.FINANCE)
  async getDashboardStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    const stats = await this.profitService.getStats(StatPeriod.MONTHLY, start, end);
    return {
      totalRevenue: stats.summary.totalRevenue,
      totalProfit: stats.summary.totalProfit,
      avgProfitMargin: stats.summary.averageProfitMargin,
      acceptedQuotes: stats.summary.acceptedCount,
      totalQuotes: stats.summary.quoteCount,
    };
  }

  @Get('by-salesperson')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.FINANCE)
  async getBySalesperson(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    const stats = await this.profitService.getStats(StatPeriod.MONTHLY, start, end);
    return stats.bySalesPerson.map(item => ({
      id: item.salesPersonId,
      name: item.salesPersonId,
      count: item.acceptedCount,
      profit: item.profit,
    }));
  }

  @Get('quotes')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.FINANCE)
  async getQuoteListForStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('salesPersonId') salesPersonId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    return this.profitService.getQuoteListForStats(start, end, salesPersonId, Number(page), Number(limit));
  }

  @Get('monthly')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.FINANCE)
  async getMonthlyStats(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month !== undefined ? month : new Date().getMonth();
    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0);
    return this.profitService.getStats(StatPeriod.MONTHLY, start, end);
  }
}
