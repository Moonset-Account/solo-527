import { prisma, Prisma } from '../lib/prisma';

export const logService = {
  async list(options: {
    page?: number;
    pageSize?: number;
    action?: string;
    operatorId?: string;
    taskId?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};
    if (options.action) where.action = options.action;
    if (options.operatorId) where.operatorId = options.operatorId;
    if (options.taskId) where.taskId = options.taskId;
    if (options.fromDate || options.toDate) {
      where.createdAt = {};
      if (options.fromDate) where.createdAt.gte = new Date(options.fromDate);
      if (options.toDate)
        where.createdAt.lte = new Date(options.toDate + 'T23:59:59');
    }

    const page = options.page || 1;
    const pageSize = options.pageSize || 30;

    const [total, items] = await Promise.all([
      prisma.taskLog.count({ where }),
      prisma.taskLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          operator: { select: { id: true, name: true, role: true } },
          task: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, page, pageSize, items };
  },

  async create(data: {
    action: string;
    taskId?: string;
    operatorId: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.taskLog.create({
      data: {
        ...data,
        oldValue: data.oldValue as Prisma.InputJsonValue | undefined,
        newValue: data.newValue as Prisma.InputJsonValue | undefined,
      },
    });
  },
};
