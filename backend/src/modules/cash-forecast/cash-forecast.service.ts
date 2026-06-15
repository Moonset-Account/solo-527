import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns';
import { CashForecast, Bill, CollectionRecord } from '@/database/entities';

@Injectable()
export class CashForecastService {
  constructor(
    @InjectRepository(CashForecast)
    private forecastRepository: Repository<CashForecast>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
  ) {}

  async generate(period: string, openingBalance: number, userId?: string): Promise<CashForecast> {
    const [year, month] = period.split('-').map(Number);
    const forecastDate = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(forecastDate);

    const bills = await this.billRepository.createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .where('bill.dueDate BETWEEN :start AND :end', { start: forecastDate, end: periodEnd })
      .andWhere('bill.status NOT IN (:...excluded)', { excluded: ['draft', 'paid', 'written_off', 'cancelled'] })
      .getMany();

    const expectedReceivables = bills.reduce((sum, b) => {
      const probability = this.getCollectionProbability(b);
      return sum + (Number(b.remainingAmount) * probability);
    }, 0);

    const billBreakdown = bills.map(b => ({
      billId: b.id,
      billNumber: b.billNumber,
      customerName: b.customer?.name || '',
      expectedAmount: Number(b.remainingAmount) * this.getCollectionProbability(b),
      actualAmount: 0,
      variance: 0,
      status: b.status,
    }));

    const projectedClosingBalance = openingBalance + expectedReceivables;

    const forecast = this.forecastRepository.create({
      forecastPeriod: period,
      forecastDate,
      openingBalance,
      expectedReceivables,
      projectedClosingBalance,
      projectedCashGap: projectedClosingBalance < 0 ? Math.abs(projectedClosingBalance) : 0,
      billBreakdown,
      status: 'draft',
      createdBy: userId,
      updatedBy: userId,
    });

    return this.forecastRepository.save(forecast);
  }

  private getCollectionProbability(bill: Bill): number {
    if (bill.status === 'partial') return 0.7;
    if (bill.overdueDays <= 7) return 0.9;
    if (bill.overdueDays <= 30) return 0.6;
    if (bill.overdueDays <= 60) return 0.4;
    if (bill.overdueDays <= 90) return 0.2;
    return 0.1;
  }

  async findAll(page: number = 1, limit: number = 50): Promise<{ data: CashForecast[]; total: number }> {
    const [data, total] = await this.forecastRepository.findAndCount({
      order: { forecastPeriod: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(id: string): Promise<CashForecast> {
    const forecast = await this.forecastRepository.findOne({ where: { id } });
    if (!forecast) throw new NotFoundException('Cash forecast not found');
    return forecast;
  }

  async updateActuals(id: string, actualData: {
    actualClosingBalance: number;
    actualReceivables: number;
    billBreakdownUpdates?: Array<{ billId: string; actualAmount: number }>;
  }, userId?: string): Promise<CashForecast> {
    const forecast = await this.findOne(id);

    forecast.actualClosingBalance = actualData.actualClosingBalance;
    forecast.actualCashGap = actualData.actualClosingBalance < 0 ? Math.abs(actualData.actualClosingBalance) : 0;
    forecast.expectedReceivables = actualData.actualReceivables || forecast.expectedReceivables;

    if (actualData.billBreakdownUpdates && forecast.billBreakdown) {
      forecast.billBreakdown = forecast.billBreakdown.map(item => {
        const update = actualData.billBreakdownUpdates?.find(u => u.billId === item.billId);
        if (update) {
          return {
            ...item,
            actualAmount: update.actualAmount,
            variance: item.expectedAmount - update.actualAmount,
          };
        }
        return item;
      });
    }

    forecast.reconciliationNotes = [
      ...(forecast.reconciliationNotes || []),
      {
        variance: forecast.projectedClosingBalance - forecast.actualClosingBalance,
        reason: 'Actuals updated',
        category: 'manual_update',
      },
    ];

    forecast.updatedBy = userId;
    return this.forecastRepository.save(forecast);
  }

  async updateStatus(id: string, status: 'draft' | 'finalized' | 'reconciled', userId?: string): Promise<CashForecast> {
    const forecast = await this.findOne(id);
    forecast.status = status;
    forecast.updatedBy = userId;
    return this.forecastRepository.save(forecast);
  }

  async getTrend(months: number = 6): Promise<any> {
    const forecasts = await this.forecastRepository.find({
      order: { forecastPeriod: 'DESC' },
      take: months,
    });

    return {
      periods: forecasts.map(f => f.forecastPeriod).reverse(),
      projectedBalances: forecasts.map(f => f.projectedClosingBalance).reverse(),
      actualBalances: forecasts.map(f => f.actualClosingBalance || null).reverse(),
      projectedGaps: forecasts.map(f => f.projectedCashGap).reverse(),
      actualGaps: forecasts.map(f => f.actualCashGap || null).reverse(),
      expectedReceivables: forecasts.map(f => f.expectedReceivables).reverse(),
    };
  }
}
