import type { RevenueRecord, PaginatedResponse } from '../../shared/types';
import { mockRevenueRecords } from '../mockData';
import { getPrismaClient } from '../prisma';

interface RevenueQuery {
  page?: number;
  pageSize?: number;
  zoneId?: string;
  startDate?: string;
  endDate?: string;
  hasGap?: boolean;
  groupBy?: 'date' | 'zone' | 'device';
}

export async function getRevenueSummary() {
  const prisma = await getPrismaClient();
  
  if (prisma) {
    const result = await prisma.revenueRecord.aggregate({
      _sum: {
        chargeEnergy: true,
        dischargeEnergy: true,
        revenue: true,
        subsidy: true,
      },
      _count: {
        hasGap: true,
      },
    });

    const gapCount = await prisma.revenueRecord.count({ where: { hasGap: true } });

    return {
      totalChargeEnergy: Number(result._sum.chargeEnergy || 0),
      totalDischargeEnergy: Number(result._sum.dischargeEnergy || 0),
      totalRevenue: Number(result._sum.revenue || 0),
      totalSubsidy: Number(result._sum.subsidy || 0),
      gapCount,
      totalRecords: result._count.hasGap,
    };
  }

  const totalChargeEnergy = mockRevenueRecords.reduce((sum, r) => sum + r.chargeEnergy, 0);
  const totalDischargeEnergy = mockRevenueRecords.reduce((sum, r) => sum + r.dischargeEnergy, 0);
  const totalRevenue = mockRevenueRecords.reduce((sum, r) => sum + r.revenue, 0);
  const totalSubsidy = mockRevenueRecords.reduce((sum, r) => sum + r.subsidy, 0);
  const gapCount = mockRevenueRecords.filter(r => r.hasGap).length;

  return {
    totalChargeEnergy: Math.round(totalChargeEnergy * 100) / 100,
    totalDischargeEnergy: Math.round(totalDischargeEnergy * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalSubsidy: Math.round(totalSubsidy * 100) / 100,
    gapCount,
    totalRecords: mockRevenueRecords.length,
  };
}

export async function getRevenueDetails(query: RevenueQuery): Promise<PaginatedResponse<RevenueRecord>> {
  const prisma = await getPrismaClient();
  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  const skip = (page - 1) * pageSize;

  if (prisma) {
    const where: any = {};
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.startDate) where.date = { ...where.date, gte: new Date(query.startDate) };
    if (query.endDate) where.date = { ...where.date, lte: new Date(query.endDate) };
    if (query.hasGap !== undefined) where.hasGap = query.hasGap;

    const [data, total] = await Promise.all([
      prisma.revenueRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { date: 'desc' },
        include: {
          zone: { select: { name: true } },
          device: { select: { name: true } },
        },
      }),
      prisma.revenueRecord.count({ where }),
    ]);

    return {
      data: data.map(item => ({
        ...item,
        date: item.date.toISOString().split('T')[0],
        zoneName: item.zone?.name || '',
        deviceName: item.device?.name,
        chargeEnergy: Number(item.chargeEnergy),
        dischargeEnergy: Number(item.dischargeEnergy),
        revenue: Number(item.revenue),
        subsidy: Number(item.subsidy),
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  let filtered = [...mockRevenueRecords];
  if (query.zoneId) filtered = filtered.filter(r => r.zoneId === query.zoneId);
  if (query.startDate) filtered = filtered.filter(r => r.date >= query.startDate);
  if (query.endDate) filtered = filtered.filter(r => r.date <= query.endDate);
  if (query.hasGap !== undefined) filtered = filtered.filter(r => r.hasGap === query.hasGap);

  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = filtered.length;
  const data = filtered.slice(skip, skip + pageSize);

  return { data, total, page, pageSize };
}

export async function getGapAnalysis() {
  const prisma = await getPrismaClient();
  
  if (prisma) {
    const gaps = await prisma.revenueRecord.findMany({
      where: { hasGap: true },
      include: {
        zone: { select: { name: true } },
        device: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const reasonStats: Record<string, number> = {};
    const personStats: Record<string, number> = {};
    let totalGapDuration = 0;

    gaps.forEach(g => {
      if (g.gapReason) {
        reasonStats[g.gapReason] = (reasonStats[g.gapReason] || 0) + 1;
      }
      if (g.responsiblePerson) {
        personStats[g.responsiblePerson] = (personStats[g.responsiblePerson] || 0) + 1;
      }
      if (g.gapDurationSeconds) {
        totalGapDuration += g.gapDurationSeconds;
      }
    });

    return {
      totalGaps: gaps.length,
      totalGapDuration,
      averageGapDuration: gaps.length > 0 ? totalGapDuration / gaps.length : 0,
      reasonStats,
      personStats,
      details: gaps.map(g => ({
        id: g.id,
        date: g.date.toISOString().split('T')[0],
        zoneName: g.zone?.name,
        deviceName: g.device?.name,
        gapReason: g.gapReason,
        gapDurationSeconds: g.gapDurationSeconds,
        responsiblePerson: g.responsiblePerson,
        revenue: Number(g.revenue),
      })),
    };
  }

  const gaps = mockRevenueRecords.filter(r => r.hasGap);
  const reasonStats: Record<string, number> = {};
  const personStats: Record<string, number> = {};
  let totalGapDuration = 0;

  gaps.forEach(g => {
    if (g.gapReason) {
      reasonStats[g.gapReason] = (reasonStats[g.gapReason] || 0) + 1;
    }
    if (g.responsiblePerson) {
      personStats[g.responsiblePerson] = (personStats[g.responsiblePerson] || 0) + 1;
    }
    if (g.gapDurationSeconds) {
      totalGapDuration += g.gapDurationSeconds;
    }
  });

  return {
    totalGaps: gaps.length,
    totalGapDuration,
    averageGapDuration: gaps.length > 0 ? totalGapDuration / gaps.length : 0,
    reasonStats,
    personStats,
    details: gaps,
  };
}
