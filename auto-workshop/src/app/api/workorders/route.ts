import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/constants';
import { generateOrderNo } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const status = searchParams.get('status');
  const technicianId = searchParams.get('technicianId');

  const cacheKey = CACHE_KEYS.WORK_ORDER_LIST(
    `page=${page}&pageSize=${pageSize}&status=${status || ''}&technicianId=${technicianId || ''}`
  );

  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (technicianId) where.technicianId = technicianId;

  const [total, workOrders] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.findMany({
      where,
      include: {
        vehicle: true,
        customer: true,
        technician: true,
        items: true,
        parts: { include: { part: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const result = {
    data: workOrders,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };

  await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL.WORK_ORDER_LIST);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { vehicleId, customerId, templateId } = body;

  if (!vehicleId || !customerId) {
    return NextResponse.json({ error: 'vehicleId and customerId are required' }, { status: 400 });
  }

  const orderNo = generateOrderNo();

  const workOrder = await prisma.workOrder.create({
    data: {
      orderNo,
      vehicleId,
      customerId,
      status: 'CREATED',
    },
    include: {
      vehicle: true,
      customer: true,
      technician: true,
      items: true,
      parts: { include: { part: true } },
    },
  });

  if (templateId) {
    const template = await prisma.inspectionTemplate.findUnique({
      where: { id: templateId },
      include: { items: true },
    });

    if (template) {
      await prisma.workOrderItem.createMany({
        data: template.items.map((item: { name: string; category: string }) => ({
          workOrderId: workOrder.id,
          name: item.name,
          category: item.category,
          price: 0,
          laborFee: 0,
          status: 'pending',
        })),
      });
    }
  }

  const result = await prisma.workOrder.findUnique({
    where: { id: workOrder.id },
    include: {
      vehicle: true,
      customer: true,
      technician: true,
      items: true,
      parts: { include: { part: true } },
    },
  });

  await redis.del(CACHE_KEYS.WORK_ORDER_LIST('*'));

  return NextResponse.json(result, { status: 201 });
}
