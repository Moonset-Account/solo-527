import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { financeSchema } from '@/lib/validations';
import { hasPermission } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (
      !session ||
      !hasPermission(session.user.role, ['COMMITTEE', 'SUPER_ADMIN'])
    ) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    
    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate && endDate) {
      where.recordedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const records = await prisma.financeRecord.findMany({
      where,
      include: {
        recordedBy: { select: { id: true, name: true } },
        relatedOrder: { select: { id: true, orderNo: true } },
      },
      orderBy: { recordedAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Get finance records error:', error);
    return NextResponse.json(
      { error: '获取财务记录失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (
      !session ||
      !hasPermission(session.user.role, ['COMMITTEE', 'SUPER_ADMIN'])
    ) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const validated = financeSchema.parse(body);

    const record = await prisma.financeRecord.create({
      data: {
        type: validated.type,
        category: validated.category,
        amount: validated.amount,
        description: validated.description,
        relatedOrderId: validated.relatedOrderId || null,
        receiptUrl: validated.receiptUrl || null,
        recordedById: session.user.id,
      },
      include: {
        recordedBy: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'FinanceRecord',
        entityId: record.id,
        newValue: record as any,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Create finance record error:', error);
    return NextResponse.json(
      { error: '创建财务记录失败' },
      { status: 500 }
    );
  }
}
