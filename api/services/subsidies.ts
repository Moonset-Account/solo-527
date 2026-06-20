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
  keyword?: string;
  startDate?: string;
  endDate?: string;
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
    if (query.keyword) {
      where.OR = [
        { period: { contains: query.keyword } },
        { type: { contains: query.keyword } },
        { description: { contains: query.keyword } },
      ];
    }
    if (query.startDate) where.createdAt = { ...where.createdAt, gte: new Date(query.startDate) };
    if (query.endDate) {
      const endOfDay = new Date(query.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: endOfDay };
    }

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
  if (query.keyword) {
    const kw = query.keyword.toLowerCase();
    filtered = filtered.filter(s =>
      s.period.toLowerCase().includes(kw) ||
      s.type.toLowerCase().includes(kw) ||
      s.description.toLowerCase().includes(kw)
    );
  }
  if (query.startDate) {
    const start = new Date(query.startDate).getTime();
    filtered = filtered.filter(s => new Date(s.createdAt).getTime() >= start);
  }
  if (query.endDate) {
    const end = new Date(query.endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(s => new Date(s.createdAt).getTime() <= end.getTime());
  }

  filtered.sort((a, b) => b.period.localeCompare(a.period));

  const total = filtered.length;
  const data = filtered.slice(skip, skip + pageSize);

  return { data, total, page, pageSize };
}

export async function getSubsidyTypes(): Promise<string[]> {
  const prisma = await getPrismaClient();

  if (prisma) {
    const result = await prisma.subsidyRecord.findMany({
      select: { type: true },
      distinct: ['type'],
      orderBy: { type: 'asc' },
    });
    return result.map(r => r.type);
  }

  const types = [...new Set(mockSubsidies.map(s => s.type))];
  types.sort();
  return types;
}
