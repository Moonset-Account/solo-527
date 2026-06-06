import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canViewAllVisitors, canViewDepartmentVisitors } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser();
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
