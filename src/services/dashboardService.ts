import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';
import { addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  partTurnoverRate: number;
  qualityPassRate: number;
  pendingOrders: number;
  lowStockAlerts: number;
  deliveryAlerts: number;
  revenueTrend: ChartDataPoint[];
  orderTrend: ChartDataPoint[];
  turnoverTrend: ChartDataPoint[];
}

const CACHE_KEY = 'dashboard:data';
const CACHE_TTL = 300;

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const cached = await cache.get<DashboardData>(CACHE_KEY);
    if (cached) return cached;

    const [
      todayRevenue,
      todayOrders,
      turnoverRate,
      passRate,
      pendingOrders,
      lowStockAlerts,
      deliveryAlerts,
      revenueTrend,
      orderTrend,
      turnoverTrend,
    ] = await Promise.all([
      this.getTodayRevenue(),
      this.getTodayOrders(),
      this.getTurnoverRate(),
      this.getQualityPassRate(),
      this.getPendingOrders(),
      this.getLowStockAlerts(),
      this.getDeliveryAlerts(),
      this.getRevenueTrend(),
      this.getOrderTrend(),
      this.getTurnoverTrend(),
    ]);

    const data: DashboardData = {
      todayRevenue,
      todayOrders,
      partTurnoverRate: turnoverRate,
      qualityPassRate: passRate,
      pendingOrders,
      lowStockAlerts,
      deliveryAlerts,
      revenueTrend,
      orderTrend,
      turnoverTrend,
    };

    await cache.set(CACHE_KEY, data, CACHE_TTL);
    return data;
  },

  async getTodayRevenue(): Promise<number> {
    const today = new Date();
    const result = await prisma.order.aggregate({
      where: {
        status: 'completed',
        createdAt: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
      _sum: { totalAmount: true },
    });
    return result._sum.totalAmount ? Number(result._sum.totalAmount) : 0;
  },

  async getTodayOrders(): Promise<number> {
    const today = new Date();
    return prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
    });
  },

  async getTurnoverRate(): Promise<number> {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const [outRecords, avgStock] = await Promise.all([
      prisma.stockRecord.aggregate({
        where: { type: 'out', createdAt: { gte: thirtyDaysAgo } },
        _sum: { quantity: true },
      }),
      prisma.part.aggregate({
        _avg: { stock: true },
      }),
    ]);

    const totalOut = outRecords._sum.quantity || 0;
    const avg = avgStock._avg.stock || 1;
    return Number(((totalOut / 30) / avg).toFixed(3));
  },

  async getQualityPassRate(): Promise<number> {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const [total, passed] = await Promise.all([
      prisma.qualityCheck.count({ where: { checkedAt: { gte: thirtyDaysAgo } } }),
      prisma.qualityCheck.count({
        where: { result: 'passed', checkedAt: { gte: thirtyDaysAgo } },
      }),
    ]);
    return total > 0 ? Number((passed / total).toFixed(3)) : 1;
  },

  async getPendingOrders(): Promise<number> {
    return prisma.order.count({
      where: { status: { in: ['pending', 'in_progress', 'quality_check'] } },
    });
  },

  async getLowStockAlerts(): Promise<number> {
    return prisma.part.count({
      where: { stock: { lte: prisma.part.fields.minStock } },
    });
  },

  async getDeliveryAlerts(): Promise<number> {
    const today = new Date();
    const threeDaysLater = addDays(today, 3);
    return prisma.order.count({
      where: {
        status: { in: ['pending', 'in_progress', 'quality_check'] },
        estimatedDelivery: { lte: threeDaysLater },
      },
    });
  },

  async getRevenueTrend(): Promise<ChartDataPoint[]> {
    const days = 7;
    const result: ChartDataPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const revenue = await prisma.order.aggregate({
        where: {
          status: 'completed',
          createdAt: { gte: dayStart, lte: dayEnd },
        },
        _sum: { totalAmount: true },
      });

      result.push({
        date: date.toISOString().slice(5, 10),
        value: revenue._sum.totalAmount ? Number(revenue._sum.totalAmount) : 0,
      });
    }

    return result;
  },

  async getOrderTrend(): Promise<ChartDataPoint[]> {
    const days = 7;
    const result: ChartDataPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const count = await prisma.order.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      });

      result.push({
        date: date.toISOString().slice(5, 10),
        value: count,
      });
    }

    return result;
  },

  async getTurnoverTrend(): Promise<ChartDataPoint[]> {
    const weeks = 4;
    const result: ChartDataPoint[] = [];
    const today = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(today, i * 7));
      const weekEnd = endOfWeek(subDays(today, i * 7));

      const [outRecords, avgStock] = await Promise.all([
        prisma.stockRecord.aggregate({
          where: { type: 'out', createdAt: { gte: weekStart, lte: weekEnd } },
          _sum: { quantity: true },
        }),
        prisma.part.aggregate({ _avg: { stock: true } }),
      ]);

      const totalOut = outRecords._sum.quantity || 0;
      const avg = avgStock._avg.stock || 1;
      const days = 7;
      const rate = (totalOut / days) / avg;

      result.push({
        date: `第${i + 1}周`,
        value: Number(rate.toFixed(3)),
      });
    }

    return result;
  },

  async invalidateCache() {
    await cache.del(CACHE_KEY);
  },
};
