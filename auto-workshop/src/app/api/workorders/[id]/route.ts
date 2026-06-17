import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/constants';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cacheKey = CACHE_KEYS.WORK_ORDER(id);
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      vehicle: true,
      customer: true,
      technician: true,
      items: true,
      parts: { include: { part: true } },
      statusLogs: { orderBy: { createdAt: 'desc' } },
      testDrives: true,
      cashierOrders: true,
      followUps: true,
      partShortages: { include: { workOrderPart: true } },
    },
  });

  if (!workOrder) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }

  await redis.set(cacheKey, JSON.stringify(workOrder), 'EX', CACHE_TTL.WORK_ORDER);

  return NextResponse.json(workOrder);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.workOrder.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.technicianId !== undefined) data.technicianId = body.technicianId;
  if (body.totalAmount !== undefined) data.totalAmount = body.totalAmount;

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data,
    include: {
      vehicle: true,
      customer: true,
      technician: true,
      items: true,
      parts: { include: { part: true } },
    },
  });

  await redis.del(CACHE_KEYS.WORK_ORDER(id));
  await redis.del(CACHE_KEYS.WORK_ORDER_LIST('*'));

  return NextResponse.json(workOrder);
}
