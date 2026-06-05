import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const notification = await prisma.notification.updateMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });

    if (notification.count === 0) {
      return NextResponse.json(
        { error: '通知不存在或无权限' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return NextResponse.json(
      { error: '标记已读失败' },
      { status: 500 }
    );
  }
}
