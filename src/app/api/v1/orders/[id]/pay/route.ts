import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: params.id },
        include: { tickets: true, show: true },
      });

      if (!order || order.userId !== session.user.id) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'PENDING') {
        throw new Error('订单状态不正确');
      }

      const updatedOrder = await tx.order.update({
        where: { id: params.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      await tx.seat.updateMany({
        where: { orderId: params.id },
        data: { status: 'SOLD' },
      });

      await tx.ticketTier.updateMany({
        where: {
          showId: order.showId,
          seats: {
            some: { orderId: params.id },
          },
        },
        data: {
          soldSeats: { increment: order.tickets.length },
        },
      });

      await tx.financeRecord.create({
        data: {
          type: 'INCOME',
          category: '票务收入',
          amount: order.totalAmount,
          description: `${order.showId} 演出票务收入`,
          relatedOrderId: order.id,
          recordedById: session.user.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: session.user.id,
          type: 'TICKET',
          title: '购票成功',
          content: '您的订单已支付成功，请在我的订单中查看电子票',
          relatedId: order.id,
        },
      });

      return updatedOrder;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Pay order error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '支付失败' },
      { status: 500 }
    );
  }
}
