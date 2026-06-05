import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { productionSchema } from '@/lib/validations';
import { hasPermission } from '@/lib/utils';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const productions = await prisma.production.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: { characters: true, rehearsals: true, shows: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(productions);
  } catch (error) {
    console.error('Get productions error:', error);
    return NextResponse.json(
      { error: '获取剧目列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session.user.role, ['COMMITTEE', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const validated = productionSchema.parse(body);

    const production = await prisma.production.create({
      data: {
        title: validated.title,
        description: validated.description,
        posterUrl: validated.posterUrl || null,
        author: validated.author,
        director: validated.director,
        status: validated.status,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Production',
        entityId: production.id,
        newValue: production as any,
      },
    });

    return NextResponse.json(production, { status: 201 });
  } catch (error) {
    console.error('Create production error:', error);
    return NextResponse.json(
      { error: '创建剧目失败' },
      { status: 500 }
    );
  }
}
