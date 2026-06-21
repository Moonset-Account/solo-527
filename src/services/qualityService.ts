import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';

export interface CreateQualityCheckData {
  orderId: string;
  result: 'passed' | 'failed';
  checkedBy: string;
  remark?: string;
  failedItems?: {
    name: string;
    description: string;
    impactScope: string;
    severity: 'low' | 'medium' | 'high';
    action: string;
    nextStep: string;
    responsibleId: string;
    deadline: Date;
  }[];
}

export interface QualityListParams {
  page?: number;
  pageSize?: number;
  result?: 'passed' | 'failed';
  orderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

const CACHE_PREFIX = 'quality:';
const CACHE_TTL = 180;

export const qualityService = {
  async list(params: QualityListParams = {}) {
    const { page = 1, pageSize = 20, result, orderId, dateFrom, dateTo } = params;
    const cacheKey = `${CACHE_PREFIX}list:${page}:${pageSize}:${result || ''}:${orderId || ''}`;

    const cached = await cache.get<{ checks: unknown[]; total: number }>(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = {};
    if (result) where.result = result;
    if (orderId) where.orderId = orderId;
    if (dateFrom || dateTo) {
      where.checkedAt = {};
      if (dateFrom) (where.checkedAt as Record<string, Date>).gte = dateFrom;
      if (dateTo) (where.checkedAt as Record<string, Date>).lte = dateTo;
    }

    const [checks, total] = await Promise.all([
      prisma.qualityCheck.findMany({
        where,
        include: {
          order: {
            select: {
              orderNo: true,
              customer: { select: { name: true } },
              vehicle: { select: { plateNumber: true } },
            },
          },
          inspector: { select: { name: true } },
          _count: { select: { failedItems: true } },
        },
        orderBy: { checkedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.qualityCheck.count({ where }),
    ]);

    const resultData = { checks, total };
    await cache.set(cacheKey, resultData, CACHE_TTL);
    return resultData;
  },

  async getById(id: string) {
    return prisma.qualityCheck.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
        inspector: true,
        failedItems: {
          include: {
            responsible: { select: { name: true, role: true } },
          },
          orderBy: { severity: 'desc' },
        },
      },
    });
  },

  async create(data: CreateQualityCheckData) {
    const check = await prisma.qualityCheck.create({
      data: {
        orderId: data.orderId,
        result: data.result,
        checkedBy: data.checkedBy,
        remark: data.remark,
        failedItems: data.failedItems
          ? { create: data.failedItems.map((item) => ({ ...item, status: 'pending' })) }
          : undefined,
      },
      include: { failedItems: true },
    });

    if (data.result === 'passed') {
      await prisma.order.update({
        where: { id: data.orderId },
        data: { status: 'completed' },
      });
    }

    await this.invalidateCache();
    return check;
  },

  async updateFailedItem(
    itemId: string,
    data: Partial<{
      status: 'pending' | 'processing' | 'resolved';
      action: string;
      nextStep: string;
      responsibleId: string;
      deadline: Date;
    }>
  ) {
    const item = await prisma.qualityFailedItem.update({
      where: { id: itemId },
      data,
    });
    await this.invalidateCache();
    return item;
  },

  async getFailedItems(params: { status?: 'pending' | 'processing' | 'resolved'; severity?: 'low' | 'medium' | 'high' } = {}) {
    const { status, severity } = params;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    return prisma.qualityFailedItem.findMany({
      where,
      include: {
        qualityCheck: {
          include: {
            order: { select: { orderNo: true } },
          },
        },
        responsible: { select: { name: true, role: true } },
      },
      orderBy: [
        { severity: 'desc' },
        { deadline: 'asc' },
      ],
    });
  },

  async getFailedStats() {
    const cacheKey = `${CACHE_PREFIX}stats`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const [total, pending, processing, resolved] = await Promise.all([
      prisma.qualityFailedItem.count(),
      prisma.qualityFailedItem.count({ where: { status: 'pending' } }),
      prisma.qualityFailedItem.count({ where: { status: 'processing' } }),
      prisma.qualityFailedItem.count({ where: { status: 'resolved' } }),
    ]);

    const stats = { total, pending, processing, resolved };
    await cache.set(cacheKey, stats, CACHE_TTL);
    return stats;
  },

  async invalidateCache() {
    await cache.delPattern(`${CACHE_PREFIX}*`);
    await cache.del('dashboard:data');
  },
};
