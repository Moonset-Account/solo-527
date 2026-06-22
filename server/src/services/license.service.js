import prisma from '../config/prisma.js';
import { parsePagination } from '../utils/common.js';

export async function getLicenseList(userId, role, query) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const { type, status, pluginId, department } = query;

  const where = {};
  
  if (role === 'USER') {
    where.userId = userId;
  }
  if (type) {
    where.type = type;
  }
  if (status) {
    where.status = status;
  }
  if (pluginId) {
    where.pluginId = Number(pluginId);
  }
  if (department) {
    where.user = { department };
  }

  const [list, total] = await Promise.all([
    prisma.license.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        plugin: { select: { id: true, name: true, icon: true, category: true } },
        plan: { select: { id: true, name: true, price: true, billingCycle: true } },
        user: { select: { id: true, name: true, department: true, email: true } },
        application: { select: { id: true, reason: true } },
      },
    }),
    prisma.license.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function getLicenseDetail(id, userId, role) {
  const license = await prisma.license.findUnique({
    where: { id: Number(id) },
    include: {
      plugin: true,
      plan: true,
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          department: true,
        },
      },
      application: true,
      trialHandles: {
        orderBy: { createdAt: 'desc' },
        include: {
          handler: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!license) {
    throw new Error('授权不存在');
  }

  if (role === 'USER' && license.userId !== userId) {
    throw new Error('无权查看该授权');
  }

  return license;
}
