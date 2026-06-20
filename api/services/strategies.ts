import type { Strategy, StrategyStatus, PaginatedResponse } from '../../shared/types';
import { mockStrategies, getStrategyById, mockUsers } from '../mockData';
import { getPrismaClient } from '../prisma';

interface StrategyQuery {
  page?: number;
  pageSize?: number;
  status?: StrategyStatus;
  keyword?: string;
}

export async function getStrategies(query: StrategyQuery): Promise<PaginatedResponse<Strategy>> {
  const prisma = await getPrismaClient();
  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  const skip = (page - 1) * pageSize;

  if (prisma) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword } },
        { description: { contains: query.keyword } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.strategy.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true } } },
      }),
      prisma.strategy.count({ where }),
    ]);

    return {
      data: data.map(item => ({
        ...item,
        createdByName: item.createdBy?.name,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        triggerCondition: item.triggerCondition as Record<string, any>,
        action: item.action as Record<string, any>,
      })),
      total,
      page,
      pageSize,
    };
  }

  let filtered = [...mockStrategies];
  if (query.status) filtered = filtered.filter(s => s.status === query.status);
  if (query.keyword) {
    const kw = query.keyword.toLowerCase();
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(kw) ||
      s.description.toLowerCase().includes(kw)
    );
  }

  const total = filtered.length;
  const data = filtered.slice(skip, skip + pageSize);

  return { data, total, page, pageSize };
}

export async function getStrategy(id: string): Promise<Strategy | null> {
  const prisma = await getPrismaClient();
  
  if (prisma) {
    const strategy = await prisma.strategy.findUnique({
      where: { id },
      include: { createdBy: { select: { name: true } } },
    });

    if (!strategy) return null;

    return {
      ...strategy,
      createdByName: strategy.createdBy?.name,
      createdAt: strategy.createdAt.toISOString(),
      updatedAt: strategy.updatedAt.toISOString(),
      triggerCondition: strategy.triggerCondition as Record<string, any>,
      action: strategy.action as Record<string, any>,
    };
  }

  return getStrategyById(id) || null;
}

export async function createStrategy(
  data: Omit<Strategy, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'createdByName'>
): Promise<Strategy> {
  const prisma = await getPrismaClient();
  
  if (prisma) {
    const created = await prisma.strategy.create({
      data: {
        ...data,
        version: 1,
        triggerCondition: data.triggerCondition,
        action: data.action,
      },
      include: { createdBy: { select: { name: true } } },
    });

    return {
      ...created,
      createdByName: created.createdBy?.name,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      triggerCondition: created.triggerCondition as Record<string, any>,
      action: created.action as Record<string, any>,
    };
  }

  const creator = mockUsers.find(u => u.id === data.createdById) || mockUsers[0];
  const newStrategy: Strategy = {
    ...data,
    id: `strat${Date.now()}`,
    version: 1,
    createdByName: creator.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockStrategies.unshift(newStrategy);
  return newStrategy;
}

export async function updateStrategy(
  id: string,
  data: Partial<Omit<Strategy, 'id' | 'createdAt' | 'createdById' | 'createdByName'>>
): Promise<Strategy | null> {
  const prisma = await getPrismaClient();
  
  if (prisma) {
    const existing = await prisma.strategy.findUnique({ where: { id } });
    if (!existing) return null;

    const updated = await prisma.strategy.update({
      where: { id },
      data: {
        ...data,
        version: existing.version + 1,
        triggerCondition: data.triggerCondition || existing.triggerCondition,
        action: data.action || existing.action,
      },
      include: { createdBy: { select: { name: true } } },
    });

    return {
      ...updated,
      createdByName: updated.createdBy?.name,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      triggerCondition: updated.triggerCondition as Record<string, any>,
      action: updated.action as Record<string, any>,
    };
  }

  const index = mockStrategies.findIndex(s => s.id === id);
  if (index === -1) return null;

  mockStrategies[index] = {
    ...mockStrategies[index],
    ...data,
    version: mockStrategies[index].version + 1,
    updatedAt: new Date().toISOString(),
  };

  return mockStrategies[index];
}

export async function toggleStrategy(id: string): Promise<Strategy | null> {
  const prisma = await getPrismaClient();
  
  if (prisma) {
    const existing = await prisma.strategy.findUnique({ where: { id } });
    if (!existing) return null;

    const newStatus: StrategyStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return updateStrategy(id, { status: newStatus });
  }

  const strategy = mockStrategies.find(s => s.id === id);
  if (!strategy) return null;

  strategy.status = strategy.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  strategy.updatedAt = new Date().toISOString();
  return strategy;
}
