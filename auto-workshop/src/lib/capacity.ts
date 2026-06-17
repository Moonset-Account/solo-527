import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/constants';

export async function getTechnicianCapacityReport(
  technicianId?: string,
  periodStart?: Date,
  periodEnd?: Date
) {
  const now = new Date();
  const start = periodStart || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = periodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const cacheKey = CACHE_KEYS.TECHNICIAN_CAPACITY(
    technicianId || 'all',
    `${start.toISOString()}-${end.toISOString()}`
  );

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const where: Record<string, unknown> = {
    periodStart: { gte: start },
    periodEnd: { lte: end },
  };

  if (technicianId) {
    where.technicianId = technicianId;
  }

  const capacities = await prisma.technicianCapacity.findMany({
    where,
    include: {
      technician: { select: { id: true, name: true, specialty: true } },
    },
    orderBy: { technicianId: 'asc' },
  });

  await redis.set(cacheKey, JSON.stringify(capacities), 'EX', CACHE_TTL.TECHNICIAN_CAPACITY);

  return capacities;
}

export async function recalculateCapacity(
  technicianId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const completedOrders = await prisma.workOrder.count({
    where: {
      technicianId,
      status: 'COMPLETED',
      updatedAt: { gte: periodStart, lte: periodEnd },
    },
  });

  const abnormalCloses = await prisma.workOrder.count({
    where: {
      technicianId,
      status: 'ABNORMAL_CLOSED',
      updatedAt: { gte: periodStart, lte: periodEnd },
    },
  });

  const laborFeeResult = await prisma.workOrderItem.aggregate({
    where: {
      workOrder: {
        technicianId,
        status: { in: ['COMPLETED', 'CASHIERED'] },
        updatedAt: { gte: periodStart, lte: periodEnd },
      },
    },
    _sum: { laborFee: true },
  });

  const shortageHandles = await prisma.partShortage.count({
    where: {
      handledAt: { gte: periodStart, lte: periodEnd },
      status: 'resolved',
      workOrder: { technicianId },
    },
  });

  const shortageMarks = await prisma.partShortage.count({
    where: {
      createdAt: { gte: periodStart, lte: periodEnd },
      workOrder: { technicianId },
    },
  });

  const existing = await prisma.technicianCapacity.findFirst({
    where: { technicianId, periodStart, periodEnd },
  });

  if (existing) {
    return prisma.technicianCapacity.update({
      where: { id: existing.id },
      data: {
        completedOrders,
        totalLaborFee: laborFeeResult._sum.laborFee || 0,
        abnormalCloses,
        shortageHandles,
        shortageMarks,
      },
    });
  }

  return prisma.technicianCapacity.create({
    data: {
      technicianId,
      periodStart,
      periodEnd,
      completedOrders,
      totalLaborFee: laborFeeResult._sum.laborFee || 0,
      abnormalCloses,
      shortageHandles,
      shortageMarks,
    },
  });
}
