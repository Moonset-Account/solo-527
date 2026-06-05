import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (
      !session ||
      !hasPermission(session.user.role, [
        'TICKET_STAFF',
        'COMMITTEE',
        'SUPER_ADMIN',
      ])
    ) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { qrCode } = await request.json();

    const ticket = await prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true } },
            show: {
              include: {
                production: { select: { title: true } },
                venue: { select: { name: true } },
              },
            },
          },
        },
        seat: {
          include: { tier: true },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: '票据无效，未找到相关记录' },
        { status: 404 }
      );
    }

    if (ticket.order.status !== 'PAID') {
      return NextResponse.json(
        { error: '订单未支付，无法验票' },
        { status: 400 }
      );
    }

    if (ticket.isCheckedIn) {
      return NextResponse.json(
        {
          error: '该票已验票，请勿重复验票',
          checkedInAt: ticket.checkedInAt,
        },
        { status: 400 }
      );
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        isCheckedIn: true,
        checkedInAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CHECK_IN',
        entity: 'Ticket',
        entityId: ticket.id,
        newValue: { checkedIn: true },
      },
    });

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        isCheckedIn: true,
        checkedInAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Scan ticket error:', error);
    return NextResponse.json(
      { error: '验票失败，请稍后重试' },
      { status: 500 }
    );
  }
}
