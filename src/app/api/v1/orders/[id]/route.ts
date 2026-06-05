import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/utils';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        show: {
          include: {
            production: true,
            venue: true,
          },
        },
        tickets: {
          include: {
            seat: {
              include: {
                tier: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    const canManage = hasPermission(session.user.role || 'USER', [
      'SUPER_ADMIN',
      'COMMITTEE',
      'TICKET_STAFF',
    ]);

    if (!canManage && order.userId !== session.user.id) {
      return NextResponse.json({ error: '无权限查看此订单' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return NextResponse.json(
      { error: '获取订单详情失败' },
      { status: 500 }
    );
  }
}
