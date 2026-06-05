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

    const { ticketId, newSeatId, reason } = await request.json();

    const result = await prisma.$transaction(async (tx: any) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { seat: true },
      });

      if (!ticket) {
        throw new Error('票据不存在');
      }

      const newSeat = await tx.seat.findUnique({
        where: { id: newSeatId },
      });

      if (!newSeat || newSeat.status !== 'AVAILABLE') {
        throw new Error('目标座位不可用');
      }

      const oldSeatId = ticket.seatId;

      await tx.seat.update({
        where: { id: oldSeatId },
        data: {
          status: 'AVAILABLE',
          orderId: null,
        },
      });

      await tx.seat.update({
        where: { id: newSeatId },
        data: {
          status: 'SOLD',
          orderId: ticket.orderId,
        },
      });

      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          seatId: newSeatId,
        },
      });

      await tx.seatChangeLog.create({
        data: {
          ticketId,
          oldSeatId,
          newSeatId,
          operatorId: session.user.id,
          reason,
        },
      });

      await tx.notification.create({
        data: {
          userId: ticket.seat.orderId || '',
          type: 'TICKET',
          title: '座位已更换',
          content: `您的座位已更换，原座位: ${ticket.seat.rowLabel}排${ticket.seat.seatNumber}号，新座位: ${newSeat.rowLabel}排${newSeat.seatNumber}号`,
          relatedId: ticket.orderId,
        },
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Change seat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '换座失败' },
      { status: 500 }
    );
  }
}
