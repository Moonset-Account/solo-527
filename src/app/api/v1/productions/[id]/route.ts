import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { productionSchema } from '@/lib/validations';
import { hasPermission } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const production = await prisma.production.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        characters: {
          include: {
            actor: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { order: 'asc' },
        },
        rehearsals: {
          include: { venue: true },
          orderBy: { startTime: 'asc' },
        },
        shows: {
          include: { venue: true },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!production) {
      return NextResponse.json({ error: '剧目不存在' }, { status: 404 });
    }

    return NextResponse.json(production);
  } catch (error) {
    console.error('Get production error:', error);
    return NextResponse.json(
      { error: '获取剧目详情失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session.user.role, ['COMMITTEE', 'SUPER_ADMIN', 'DIRECTOR'])) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const validated = productionSchema.parse(body);

    const existing = await prisma.production.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: '剧目不存在' }, { status: 404 });
    }

    const production = await prisma.production.update({
      where: { id: params.id },
      data: {
        title: validated.title,
        description: validated.description,
        posterUrl: validated.posterUrl || null,
        author: validated.author,
        director: validated.director,
        status: validated.status,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Production',
        entityId: production.id,
        oldValue: existing as any,
        newValue: production as any,
      },
    });

    return NextResponse.json(production);
  } catch (error) {
    console.error('Update production error:', error);
    return NextResponse.json(
      { error: '更新剧目失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session.user.role, ['COMMITTEE', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const production = await prisma.production.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entity: 'Production',
        entityId: params.id,
        oldValue: production as any,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete production error:', error);
    return NextResponse.json(
      { error: '删除剧目失败' },
      { status: 500 }
    );
  }
}
