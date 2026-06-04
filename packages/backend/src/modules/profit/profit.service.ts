import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ProfitStat, StatPeriod } from '../../entities/profit-stat.entity';
import { Quote, QuoteStatus } from '../../entities/quote.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class ProfitService {
  constructor(
    @InjectRepository(ProfitStat)
    private profitStatRepository: Repository<ProfitStat>,
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
  ) {}

  async getStats(
    period: StatPeriod,
    startDate: Date,
    endDate: Date,
    salesPersonId?: string,
  ): Promise<{
    summary: {
      totalRevenue: number;
      totalCost: number;
      totalProfit: number;
      averageProfitMargin: number;
      conversionRate: number;
      quoteCount: number;
      acceptedCount: number;
    };
    breakdown: any[];
    bySalesPerson: any[];
  }> {
    const quotes = await this.quoteRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        ...(salesPersonId ? { createdBy: salesPersonId } : {}),
      },
      relations: ['requirement'],
    });

    const acceptedQuotes = quotes.filter(q => q.status === QuoteStatus.ACCEPTED || q.status === QuoteStatus.SENT_TO_CUSTOMER);
    const confirmedQuotes = quotes.filter(q => q.status === QuoteStatus.ACCEPTED);

    const totalRevenue = confirmedQuotes.reduce((sum, q) => sum + Number(q.totalPrice || 0), 0);
    const totalCost = confirmedQuotes.reduce((sum, q) => sum + Number(q.totalCost || 0), 0);
    const totalProfit = confirmedQuotes.reduce((sum, q) => sum + Number(q.profit || 0), 0);
    const averageProfitMargin = confirmedQuotes.length > 0
      ? confirmedQuotes.reduce((sum, q) => sum + Number(q.profitMargin || 0), 0) / confirmedQuotes.length
      : 0;
    const conversionRate = quotes.length > 0 ? (confirmedQuotes.length / quotes.length) * 100 : 0;

    const byDestination = this.groupBy(quotes, 'requirement.destination');
    const bySalesPerson = this.groupBy(quotes, 'createdBy');

    return {
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        averageProfitMargin,
        conversionRate,
        quoteCount: quotes.length,
        acceptedCount: confirmedQuotes.length,
      },
      breakdown: Object.entries(byDestination).map(([key, value]) => ({
        destination: key,
        quoteCount: value.length,
        acceptedCount: value.filter(q => q.status === QuoteStatus.ACCEPTED).length,
        revenue: value.filter(q => q.status === QuoteStatus.ACCEPTED).reduce((sum, q) => sum + Number(q.totalPrice || 0), 0),
        profit: value.filter(q => q.status === QuoteStatus.ACCEPTED).reduce((sum, q) => sum + Number(q.profit || 0), 0),
      })),
      bySalesPerson: Object.entries(bySalesPerson).map(([key, value]) => ({
        salesPersonId: key,
        quoteCount: value.length,
        acceptedCount: value.filter(q => q.status === QuoteStatus.ACCEPTED).length,
        revenue: value.filter(q => q.status === QuoteStatus.ACCEPTED).reduce((sum, q) => sum + Number(q.totalPrice || 0), 0),
        profit: value.filter(q => q.status === QuoteStatus.ACCEPTED).reduce((sum, q) => sum + Number(q.profit || 0), 0),
        conversionRate: value.length > 0
          ? (value.filter(q => q.status === QuoteStatus.ACCEPTED).length / value.length) * 100
          : 0,
      })),
    };
  }

  async getQuoteListForStats(
    startDate: Date,
    endDate: Date,
    salesPersonId?: string,
    page = 1,
    limit = 50,
  ) {
    const where: any = {
      createdAt: Between(startDate, endDate),
    };
    
    if (salesPersonId) {
      where.createdBy = salesPersonId;
    }

    const [data, total] = await this.quoteRepository.findAndCount({
      where,
      relations: ['requirement'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  private groupBy(array: any[], key: string): Record<string, any[]> {
    return array.reduce((result, item) => {
      const keys = key.split('.');
      let value = item;
      for (const k of keys) {
        value = value?.[k];
      }
      const groupKey = value || 'unknown';
      (result[groupKey] = result[groupKey] || []).push(item);
      return result;
    }, {});
  }
}
