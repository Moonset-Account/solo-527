import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CACHE_KEYS } from '@/lib/constants';
import { recordWorkOrderSnapshot } from '@/lib/workorder-snapshot';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const items = await prisma.workOrderItem.findMany({
    where: { workOrderId: id },
    orderBy: { category: 'asc' },
  });

  return NextResponse.json(items);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { itemId, name, price, laborFee, status, remark, changedBy } = body;

  if (!itemId) {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
  }

  const existing = await prisma.workOrderItem.findFirst({
    where: { id: itemId, workOrderId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: '服务项目不存在' }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (price !== undefined) data.price = price;
  if (laborFee !== undefined) data.laborFee = laborFee;
  if (status !== undefined) data.status = status;
  if (remark !== undefined) data.remark = remark;

  const updated = await prisma.workOrderItem.update({
    where: { id: itemId },
    data,
  });

  const changes: string[] = [];
  if (price !== undefined && Number(existing.price) !== Number(price)) changes.push(`价格 ¥${existing.price}→¥${price}`);
  if (laborFee !== undefined && Number(existing.laborFee) !== Number(laborFee)) changes.push(`工时费 ¥${existing.laborFee}→¥${laborFee}`);
  if (status !== undefined && existing.status !== status) changes.push(`状态 ${existing.status}→${status}`);
  if (name !== undefined) changes.push(`名称更新`);
  if (remark !== undefined) changes.push(`备注更新`);

  const reason = changes.length > 0
    ? `编辑服务项目「${updated.name}」: ${changes.join(', ')}`
    : `编辑服务项目「${updated.name}」`;

  await recordWorkOrderSnapshot(id, changedBy || '系统', reason, {
    itemAction: 'updated',
    itemId: updated.id,
    itemName: updated.name,
  });

  return NextResponse.json(updated);
}
