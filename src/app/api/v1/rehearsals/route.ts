import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rehearsalSchema } from '@/lib/validations';
import { hasPermission } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const productionId = searchParams.get('productionId');

    const where: any = {};
    
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    if (productionId) {
      where.productionId = productionId;
    }

    const rehearsals = await prisma.rehearsal.findMany({
      where,
      include: {
        production: { select: { id: true, title: true } },
        venue: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        leaveRequests: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(rehearsals);
  } catch (error) {
    console.error('Get rehearsals error:', error);
    return NextResponse.json(
      { error: '获取排练列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session.user.role, ['DIRECTOR', 'COMMITTEE', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const validated = rehearsalSchema.parse(body);

    const rehearsal = await prisma.rehearsal.create({
      data: {
        productionId: validated.productionId,
        venueId: validated.venueId,
        title: validated.title,
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
        content: validated.content,
        createdById: session.user.id,
      },
      include: {
        production: { select: { id: true, title: true } },
        venue: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Rehearsal',
        entityId: rehearsal.id,
        newValue: rehearsal as any,
      },
    });

    const characters = await prisma.character.findMany({
      where: { productionId: validated.productionId, actorId: { not: null } },
      select: { actorId: true },
    });

    for (const char of characters) {
      if (char.actorId) {
        await prisma.notification.create({
          data: {
            userId: char.actorId,
            type: 'REHEARSAL',
            title: '新排练安排',
            content: `${rehearsal.production.title} 有新的排练安排：${rehearsal.title}，时间：${validated.startTime}`,
            relatedId: rehearsal.id,
          },
        });
      }
    }

    return NextResponse.json(rehearsal, { status: 201 });
  } catch (error) {
    console.error('Create rehearsal error:', error);
    return NextResponse.json(
      { error: '创建排练失败' },
      { status: 500 }
    );
  }
}
