import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const shows = await prisma.show.findMany({
      include: {
        production: {
          select: { id: true, title: true, posterUrl: true },
        },
        venue: {
          select: { id: true, name: true, location: true },
        },
        ticketTiers: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(shows);
  } catch (error) {
    console.error('Get shows error:', error);
    return NextResponse.json(
      { error: '获取演出列表失败' },
      { status: 500 }
    );
  }
}
