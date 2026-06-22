import prisma from '../config/prisma.js';
import { parsePagination } from '../utils/common.js';

export async function getPlanList(query) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const { pluginId, status, billingCycle } = query;

  const where = {};
  if (pluginId) {
    where.pluginId = Number(pluginId);
  }
  if (status) {
    where.status = status;
  }
  if (billingCycle) {
    where.billingCycle = billingCycle;
  }

  const [list, total] = await Promise.all([
    prisma.pricingPlan.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        plugin: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.pricingPlan.count({ where }),
  ]);

  const listWithFeatures = list.map(item => ({
    ...item,
    features: item.features ? JSON.parse(item.features) : [],
    price: Number(item.price),
  }));

  return { list: listWithFeatures, total, page, pageSize };
}

export async function createPlan(data) {
  const { pluginId, name, code, description, seatCount, features, billingCycle, price } = data;

  const existing = await prisma.pricingPlan.findFirst({ where: { code } });
  if (existing) {
    throw new Error('套餐编码已存在');
  }

  const plan = await prisma.pricingPlan.create({
    data: {
      pluginId,
      name,
      code,
      description,
      seatCount,
      features: JSON.stringify(features || []),
      billingCycle,
      price,
    },
  });

  return {
    ...plan,
    features: plan.features ? JSON.parse(plan.features) : [],
    price: Number(plan.price),
  };
}

export async function updatePlan(id, data) {
  const { name, description, seatCount, features, billingCycle, price, status } = data;

  const existing = await prisma.pricingPlan.findUnique({ where: { id: Number(id) } });
  if (!existing) {
    throw new Error('套餐不存在');
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (seatCount !== undefined) updateData.seatCount = seatCount;
  if (features !== undefined) updateData.features = JSON.stringify(features);
  if (billingCycle !== undefined) updateData.billingCycle = billingCycle;
  if (price !== undefined) updateData.price = price;
  if (status !== undefined) updateData.status = status;

  const plan = await prisma.pricingPlan.update({
    where: { id: Number(id) },
    data: updateData,
  });

  return {
    ...plan,
    features: plan.features ? JSON.parse(plan.features) : [],
    price: Number(plan.price),
  };
}
