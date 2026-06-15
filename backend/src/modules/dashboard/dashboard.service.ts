import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill, CollectionRecord, Reconciliation, CashForecast } from '@/database/entities';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(CollectionRecord)
    private collectionRepository: Repository<CollectionRecord>,
    @InjectRepository(Reconciliation)
    private reconciliationRepository: Repository<Reconciliation>,
    @InjectRepository(CashForecast)
    private cashForecastRepository: Repository<CashForecast>,
  ) {}

  async getOverview(): Promise<any> {
    const billStats = await this.billRepository.createQueryBuilder('bill')
      .select('COUNT(*)', 'totalBills')
      .addSelect('SUM(bill.totalAmount)', 'totalAmount')
      .addSelect('SUM(bill.paidAmount)', 'paidAmount')
      .addSelect('SUM(bill.remainingAmount)', 'remainingAmount')
      .addSelect('SUM(CASE WHEN bill.status = \'overdue\' THEN bill.remainingAmount ELSE 0 END)', 'overdueAmount')
      .addSelect('COUNT(CASE WHEN bill.status = \'overdue\' THEN 1 END)', 'overdueCount')
      .addSelect('AVG(bill.overdueDays)', 'avgOverdueDays')
      .getRawOne();

    const collectionStats = await this.collectionRepository.createQueryBuilder('cr')
      .select('COUNT(*)', 'totalCollections')
      .addSelect('COUNT(CASE WHEN cr.status = \'pending\' THEN 1 END)', 'pendingCount')
      .addSelect('COUNT(CASE WHEN cr.status = \'completed\' THEN 1 END)', 'completedCount')
      .addSelect('COUNT(CASE WHEN cr.customerResponse = \'promised_to_pay\' THEN 1 END)', 'promisedCount')
      .getRawOne();

    const recentBills = await this.billRepository.createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .where('bill.remainingAmount > 0')
      .andWhere('bill.status NOT IN (:...excluded)', { excluded: ['paid', 'written_off', 'draft'] })
      .orderBy('bill.overdueDays', 'DESC')
      .limit(10)
      .getMany();

    const recentCollections = await this.collectionRepository.createQueryBuilder('cr')
      .leftJoinAndSelect('cr.bill', 'bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('cr.rhythm', 'rhythm')
      .where('cr.status = \'pending\'')
      .orderBy('cr.createdAt', 'DESC')
      .limit(10)
      .getMany();

    return {
      summary: {
        totalBills: parseInt(billStats.totalBills || 0),
        totalAmount: parseFloat(billStats.totalAmount || 0),
        paidAmount: parseFloat(billStats.paidAmount || 0),
        remainingAmount: parseFloat(billStats.remainingAmount || 0),
        overdueAmount: parseFloat(billStats.overdueAmount || 0),
        overdueCount: parseInt(billStats.overdueCount || 0),
        avgOverdueDays: parseFloat(billStats.avgOverdueDays || 0),
        totalCollections: parseInt(collectionStats.totalCollections || 0),
        pendingCollections: parseInt(collectionStats.pendingCount || 0),
        completedCollections: parseInt(collectionStats.completedCount || 0),
        promisedPayments: parseInt(collectionStats.promisedCount || 0),
      },
      recentOverdueBills: recentBills.map(b => ({
        id: b.id,
        billNumber: b.billNumber,
        customerName: b.customer?.name,
        remainingAmount: b.remainingAmount,
        dueDate: b.dueDate,
        overdueDays: b.overdueDays,
        status: b.status,
      })),
      pendingCollections: recentCollections.map(c => ({
        id: c.id,
        customerName: c.bill?.customer?.name,
        billNumber: c.bill?.billNumber,
        severity: c.severity,
        channel: c.channel,
        scheduledDate: c.scheduledDate,
        rhythmName: c.rhythm?.name,
      })),
    };
  }

  async getAgingReport(): Promise<any> {
    const brackets = [
      { name: 'Current', minDays: 0, maxDays: 0 },
      { name: '1-30 days', minDays: 1, maxDays: 30 },
      { name: '31-60 days', minDays: 31, maxDays: 60 },
      { name: '61-90 days', minDays: 61, maxDays: 90 },
      { name: '90+ days', minDays: 91, maxDays: 9999 },
    ];

    const result: any[] = [];

    for (const bracket of brackets) {
      let query = this.billRepository.createQueryBuilder('bill')
        .leftJoinAndSelect('bill.customer', 'customer')
        .where('bill.remainingAmount > 0')
        .andWhere('bill.status NOT IN (:...excluded)', { excluded: ['paid', 'written_off', 'draft'] });

      if (bracket.minDays === 0) {
        query = query.andWhere('bill.overdueDays = 0');
      } else {
        query = query.andWhere('bill.overdueDays BETWEEN :min AND :max', { min: bracket.minDays, max: bracket.maxDays });
      }

      const stats = await query
        .select('COUNT(*)', 'count')
        .addSelect('SUM(bill.remainingAmount)', 'amount')
        .getRawOne();

      result.push({
        bracket: bracket.name,
        count: parseInt(stats.count || 0),
        amount: parseFloat(stats.amount || 0),
      });
    }

    return result;
  }

  async getMonthlyTrend(months: number = 6): Promise<any> {
    const reconciliations = await this.reconciliationRepository.find({
      order: { period: 'DESC' },
      take: months,
    });

    return reconciliations.map(r => ({
      period: r.period,
      systemBillsTotal: r.systemBillsTotal,
      bankDepositsTotal: r.bankDepositsTotal,
      totalVariance: r.totalVariance,
      matchedBills: r.matchedBills,
      totalBills: r.totalBills,
      matchRate: r.totalBills > 0 ? ((r.matchedBills / r.totalBills) * 100).toFixed(1) + '%' : '0%',
    })).reverse();
  }
}
