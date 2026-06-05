import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const seats = await prisma.seat.findMany({
      where: { showId: params.id },
      include: {
        tier: true,
      },
      orderBy: [
        { rowLabel: 'asc' },
        { seatNumber: 'asc' },
      ],
    });

    const tiers = await prisma.ticketTier.findMany({
      where: { showId: params.id },
    });

    return NextResponse.json({ seats, tiers });
  } catch (error) {
    console.error('Get seats error:', error);
    return NextResponse.json(
      { error: '获取座位信息失败' },
      { status: 500 }
    );
  }
}
