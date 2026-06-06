import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Quote } from '../../entities/quote.entity';
import { PaymentNode } from '../../entities/payment-node.entity';
import dayjs from 'dayjs';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(PaymentNode)
    private paymentNodeRepository: Repository<PaymentNode>,
  ) {}

  async getProfitReport(query: any) {
    const { startDate, endDate, createdBy } = query;
    const where: any = { status: 'approved' };

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }
    if (createdBy) {
      where.createdById = createdBy;
    }

    const quotes = await this.quoteRepository.find({
      where,
      relations: ['createdBy', 'demand'],
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    const quoteProfits = quotes.map((quote) => {
      const revenue = Number(quote.totalPrice);
      const cost = Number(quote.totalCost);
      const profit = revenue - cost;

      totalRevenue += revenue;
      totalCost += cost;
      totalProfit += profit;

      return {
        quoteId: quote.id,
        customerName: quote.demand?.customerName || '',
        createdByName: quote.createdBy?.name || '',
        revenue,
        cost,
        profit,
        profitMargin: quote.profitMargin,
        createdAt: quote.createdAt,
      };
    });

    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        overallMargin,
        quoteCount: quotes.length,
      },
      details: quoteProfits,
    };
  }

  async getPaymentNodes(query: any) {
    const { status, quoteId, dueDateStart, dueDateEnd } = query;
    const where: any = {};

    if (status) where.status = status;
    if (quoteId) where.quoteId = quoteId;
    if (dueDateStart && dueDateEnd) {
      where.dueDate = Between(new Date(dueDateStart), new Date(dueDateEnd));
    }

    const nodes = await this.paymentNodeRepository.find({
      where,
      relations: ['quote', 'quote.demand'],
      order: { dueDate: 'ASC' },
    });

    return nodes;
  }

  async markPaymentPaid(nodeId: string) {
    const node = await this.paymentNodeRepository.findOne({ where: { id: nodeId } });
    if (!node) {
      throw new Error('付款节点不存在');
    }
    node.status = 'paid';
    node.paidAt = new Date();
    return this.paymentNodeRepository.save(node);
  }

  async getMonthlyTrend(months: number = 6) {
    const trend = [];
    const now = dayjs();

    for (let i = months - 1; i >= 0; i--) {
      const month = now.subtract(i, 'month');
      const startOfMonth = month.startOf('month').toDate();
      const endOfMonth = month.endOf('month').toDate();

      const quotes = await this.quoteRepository.find({
        where: {
          status: 'approved',
          createdAt: Between(startOfMonth, endOfMonth),
        },
      });

      const revenue = quotes.reduce((sum, q) => sum + Number(q.totalPrice), 0);
      const cost = quotes.reduce((sum, q) => sum + Number(q.totalCost), 0);
      const profit = revenue - cost;

      trend.push({
        month: month.format('YYYY-MM'),
        revenue,
        cost,
        profit,
        quoteCount: quotes.length,
      });
    }

    return trend;
  }
}
