import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateOrderNo, generateQRCodeContent } from '@/lib/utils';
import QRCode from 'qrcode';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: '获取订单列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { showId, seatIds } = await request.json();

    if (!seatIds || seatIds.length === 0) {
      return NextResponse.json(
        { error: '请至少选择一个座位' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const seats = await tx.seat.findMany({
        where: {
          id: { in: seatIds },
          showId,
          status: 'AVAILABLE',
        },
        include: { tier: true },
      });

      if (seats.length !== seatIds.length) {
        throw new Error('部分座位已被售出，请重新选择');
      }

      const totalAmount = seats.reduce(
        (sum, seat) => sum + seat.tier.price.toNumber(),
        0
      );

      const orderNo = generateOrderNo();

      const order = await tx.order.create({
        data: {
          orderNo,
          userId: session.user.id,
          showId,
          totalAmount,
          status: 'PENDING',
        },
      });

      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: {
          status: 'HELD',
          orderId: order.id,
        },
      });

      for (const seat of seats) {
        const qrContent = generateQRCodeContent(order.id);
        const qrCode = await QRCode.toDataURL(qrContent);
        
        await tx.ticket.create({
          data: {
            orderId: order.id,
            seatId: seat.id,
            qrCode: order.id + '-' + seat.id,
          },
        });
      }

      return order;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建订单失败' },
      { status: 500 }
    );
  }
}
