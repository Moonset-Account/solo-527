import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CACHE_KEYS } from '@/lib/constants';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const parts = await prisma.workOrderPart.findMany({
    where: { workOrderId: id },
    include: { part: true },
  });

  return NextResponse.json(parts);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { partId, quantity, unitPrice } = body;

  if (!partId || !quantity || !unitPrice) {
    return NextResponse.json(
      { error: 'partId, quantity, and unitPrice are required' },
      { status: 400 }
    );
  }

  const workOrderPart = await prisma.workOrderPart.create({
    data: {
      workOrderId: id,
      partId,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      status: 'pending',
    },
    include: { part: true },
  });

  await redis.del(CACHE_KEYS.WORK_ORDER(id));
  await redis.del(CACHE_KEYS.WORK_ORDER_LIST('*'));

  return NextResponse.json(workOrderPart, { status: 201 });
}
