import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerCurrentUser } from '@/lib/auth';
import { canViewAllVisitors } from '@/lib/permissions';

function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('X-User-Id');
  return getServerCurrentUser(userId || undefined);
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as any;

    let where: any = {};

    if (status) {
      where.status = status;
    }

    if (!canViewAllVisitors(user)) {
      where.meeting = {
        departmentId: user.departmentId,
        hostId: user.id,
      };
    }

    const visitors = await prisma.visitor.findMany({
      where,
      include: {
        meeting: {
          include: {
            room: true,
            host: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tokens: {
          where: { isActive: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ visitors });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    return NextResponse.json(
      { error: '获取访客列表失败' },
      { status: 500 }
    );
  }
}
