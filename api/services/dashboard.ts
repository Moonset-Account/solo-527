import type { DashboardStats, TrendDataPoint } from '../../shared/types';
import { mockDashboardStats, mockTrendData } from '../mockData';
import { getPrismaClient } from '../prisma';

export async function getDashboardStats(): Promise<DashboardStats> {
  const prisma = await getPrismaClient();
  
  if (prisma) {
    const [totalAlerts, pendingAlerts, processingAlerts, completedAlerts, abnormalClosedAlerts, activeStrategies] = await Promise.all([
      prisma.deviceAlert.count(),
      prisma.deviceAlert.count({ where: { status: 'PENDING' } }),
      prisma.deviceAlert.count({ where: { status: 'PROCESSING' } }),
      prisma.deviceAlert.count({ where: { status: 'COMPLETED' } }),
      prisma.deviceAlert.count({ where: { status: 'ABNORMAL_CLOSED' } }),
      prisma.strategy.count({ where: { status: 'ACTIVE' } }),
    ]);

    const totalRevenue = await prisma.revenueRecord.aggregate({
      _sum: { revenue: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRevenue = await prisma.revenueRecord.aggregate({
      _sum: { revenue: true },
      where: { date: { gte: today, lt: tomorrow } },
    });

    const alertProcessingRate = totalAlerts > 0 ? ((completedAlerts + abnormalClosedAlerts) / totalAlerts) * 100 : 0;

    return {
      totalAlerts,
      pendingAlerts,
      processingAlerts,
      completedAlerts,
      abnormalClosedAlerts,
      alertProcessingRate: Math.round(alertProcessingRate * 100) / 100,
      totalRevenue: Number(totalRevenue._sum.revenue || 0),
      todayRevenue: Number(todayRevenue._sum.revenue || 0),
      onlineDeviceRate: 96.3,
      activeStrategies,
    };
  }

  return mockDashboardStats;
}

export async function getTrendData(days: number = 7): Promise<TrendDataPoint[]> {
  const prisma = await getPrismaClient();
  
  if (prisma) {
    const result: TrendDataPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [alerts, revenue] = await Promise.all([
        prisma.deviceAlert.count({
          where: { createdAt: { gte: date, lt: nextDate } },
        }),
        prisma.revenueRecord.aggregate({
          _sum: { revenue: true },
          where: { date: { gte: date, lt: nextDate } },
        }),
      ]);

      result.push({
        date: date.toISOString().split('T')[0],
        alerts,
        revenue: Number(revenue._sum.revenue || 0),
      });
    }

    return result;
  }

  return mockTrendData;
}
