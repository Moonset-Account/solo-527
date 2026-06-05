import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const showId = searchParams.get('showId');
    const my = searchParams.get('my') === 'true';

    const where: any = {};
    if (showId) where.showId = showId;
    if (my) where.userId = session.user.id;

    const entries = await prisma.waitlistEntry.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        tier: true,
        show: {
          include: {
            production: true,
          },
        },
      },
      orderBy: [
        { showId: 'asc' },
        { position: 'asc' },
      ],
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Failed to fetch waitlist:', error);
    return NextResponse.json(
      { error: '获取候补名单失败' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await req.json();
    const { showId, tierId } = body;

    if (!showId || !tierId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const existing = await prisma.waitlistEntry.findFirst({
      where: {
        showId,
        userId: session.user.id,
        tierId,
        status: 'WAITING',
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: '您已在候补名单中' },
        { status: 400 }
      );
    }

    const maxPosition = await prisma.waitlistEntry.aggregate({
      where: { showId, tierId, status: 'WAITING' },
      _max: { position: true },
    });

    const position = (maxPosition._max.position || 0) + 1;

    const entry = await prisma.waitlistEntry.create({
      data: {
        showId,
        userId: session.user.id,
        tierId,
        position,
        status: 'WAITING',
      },
      include: {
        user: true,
        tier: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'TICKET',
        title: '候补登记成功',
        content: `您已成功加入候补名单，当前排位：第 ${position} 位`,
        relatedId: entry.id,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Failed to create waitlist entry:', error);
    return NextResponse.json(
      { error: '加入候补名单失败' },
      { status: 500 }
    );
  }
}
