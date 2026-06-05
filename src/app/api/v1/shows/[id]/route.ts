import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const show = await prisma.show.findUnique({
      where: { id: params.id },
      include: {
        production: true,
        venue: true,
        ticketTiers: true,
      },
    });

    if (!show) {
      return NextResponse.json({ error: '演出不存在' }, { status: 404 });
    }

    return NextResponse.json(show);
  } catch (error) {
    console.error('Failed to fetch show:', error);
    return NextResponse.json(
      { error: '获取演出信息失败' },
      { status: 500 }
    );
  }
}
