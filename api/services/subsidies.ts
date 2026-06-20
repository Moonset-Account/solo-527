import type { SubsidyRecord, PaginatedResponse } from '../../shared/types';
import { mockSubsidies } from '../mockData';
import { getPrismaClient } from '../prisma';

interface SubsidyQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  zoneId?: string;
  period?: string;
}

export async function getSubsidies(query: SubsidyQuery): Promise<PaginatedResponse<SubsidyRecord>> {
  const prisma = await getPrismaClient();
  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  const skip = (page - 1) * pageSize;

  if (prisma) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.period) where.period = query.period;

    const [data, total] = await Promise.all([
      prisma.subsidyRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { period: 'desc' },
        include: { zone: { select: { name: true } } },
      }),
      prisma.subsidyRecord.count({ where }),
    ]);

    return {
      data: data.map(item => ({
        ...item,
        zoneName: item.zone?.name || '',
        amount: Number(item.amount),
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  let filtered = [...mockSubsidies];
  if (query.status) filtered = filtered.filter(s => s.status === query.status);
  if (query.type) filtered = filtered.filter(s => s.type === query.type);
  if (query.zoneId) filtered = filtered.filter(s => s.zoneId === query.zoneId);
  if (query.period) filtered = filtered.filter(s => s.period === query.period);

  filtered.sort((a, b) => b.period.localeCompare(a.period));

  const total = filtered.length;
  const data = filtered.slice(skip, skip + pageSize);

  return { data, total, page, pageSize };
}
