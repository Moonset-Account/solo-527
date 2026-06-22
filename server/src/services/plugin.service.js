import prisma from '../config/prisma.js';
import { parsePagination } from '../utils/common.js';

export async function getPluginList(query) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const { keyword, category, status } = query;

  const where = {};
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { description: { contains: keyword } },
    ];
  }
  if (category) {
    where.category = category;
  }
  if (status) {
    where.status = status;
  }

  const [list, total] = await Promise.all([
    prisma.plugin.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        plans: {
          where: { status: 'ACTIVE' },
          orderBy: { price: 'asc' },
        },
      },
    }),
    prisma.plugin.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function getPluginDetail(id) {
  const plugin = await prisma.plugin.findUnique({
    where: { id: Number(id) },
    include: {
      plans: {
        where: { status: 'ACTIVE' },
        orderBy: { price: 'asc' },
      },
    },
  });

  if (!plugin) {
    throw new Error('插件不存在');
  }

  return plugin;
}
