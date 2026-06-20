import { prisma } from '@/lib/prisma';
import { cacheDelByPattern } from '@/lib/redis';
import { exportToExcel, exportToCSV } from '@/lib/export';
import type { HitScreenInput } from '@/lib/validation';

export async function getKnowledgeHits(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const { status, page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.knowledgeHit.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        knowledge: { select: { id: true, title: true, status: true } },
        ticket: { select: { id: true, title: true, priority: true, status: true } },
        screener: { select: { name: true } },
      },
    }),
    prisma.knowledgeHit.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function screenHits(data: HitScreenInput, screenedBy: string) {
  const { hitIds, status } = data;

  const result = await prisma.knowledgeHit.updateMany({
    where: { id: { in: hitIds } },
    data: {
      status,
      screenedBy,
      screenedAt: new Date(),
    },
  });

  await cacheDelByPattern('hits:notifications:*');
  return result;
}

export async function exportHits(format: 'xlsx' | 'csv', filters?: Record<string, unknown>) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.startDate) where.createdAt = { gte: filters.startDate };
  if (filters?.endDate) where.createdAt = { ...(where.createdAt as object), lte: filters.endDate };

  const hits = await prisma.knowledgeHit.findMany({
    where,
    include: {
      knowledge: { select: { title: true } },
      ticket: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (format === 'xlsx') {
    return exportToExcel({ hits }, '知识命中记录');
  } else {
    return exportToCSV({ hits });
  }
}

export async function getHitStats() {
  const stats = await prisma.knowledgeHit.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const byKnowledge = await prisma.knowledgeHit.groupBy({
    by: ['knowledgeId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
    where: { status: 'VALID' },
  });

  const knowledgeIds = byKnowledge.map(h => h.knowledgeId);
  const knowledgeList = await prisma.knowledge.findMany({
    where: { id: { in: knowledgeIds } },
    select: { id: true, title: true },
  });

  const hitMap = new Map(byKnowledge.map(h => [h.knowledgeId, h._count.id]));

  return {
    statusCounts: stats.map(s => ({ status: s.status, count: s._count.id })),
    topKnowledge: knowledgeList.map(k => ({
      ...k,
      hitCount: hitMap.get(k.id) || 0,
    })),
  };
}

export async function getPendingHitsCount() {
  return prisma.knowledgeHit.count({ where: { status: 'PENDING' } });
}
