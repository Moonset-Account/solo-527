import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/utils';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const canManage = hasPermission(session.user.role || 'USER', [
      'SUPER_ADMIN',
      'COMMITTEE',
      'TICKET_STAFF',
    ]);

    if (!canManage) {
      return NextResponse.json({ error: '无权限操作' }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    const entry = await prisma.waitlistEntry.update({
      where: { id: params.id },
      data: { status },
      include: {
        user: true,
        tier: true,
        show: {
          include: { production: true },
        },
      },
    });

    if (status === 'OFFERED') {
      await prisma.notification.create({
        data: {
          userId: entry.userId,
          type: 'TICKET',
          title: '候补排位通知',
          content: `恭喜！您在《${entry.show.production.title}》的候补排位已轮到，请在24小时内完成购票。`,
          relatedId: entry.id,
        },
      });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Failed to update waitlist entry:', error);
    return NextResponse.json(
      { error: '更新候补状态失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: params.id },
    });

    if (!entry) {
      return NextResponse.json({ error: '候补记录不存在' }, { status: 404 });
    }

    const canManage = hasPermission(session.user.role || 'USER', [
      'SUPER_ADMIN',
      'COMMITTEE',
      'TICKET_STAFF',
    ]);

    if (!canManage && entry.userId !== session.user.id) {
      return NextResponse.json({ error: '无权限操作' }, { status: 403 });
    }

    await prisma.waitlistEntry.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete waitlist entry:', error);
    return NextResponse.json(
      { error: '取消候补失败' },
      { status: 500 }
    );
  }
}
