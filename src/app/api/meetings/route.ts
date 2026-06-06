import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canViewDepartmentVisitors } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const roomId = searchParams.get('roomId');

  try {
    const where: any = {};

    if (roomId) {
      where.roomId = roomId;
    }

    if (startDate && endDate) {
      where.OR = [
        {
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          endTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          startTime: {
            lte: new Date(startDate),
          },
          endTime: {
            gte: new Date(endDate),
          },
        },
      ];
    }

    where.status = {
      in: ['SCHEDULED', 'IN_PROGRESS'],
    };

    const meetings = await prisma.meeting.findMany({
      where,
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
        visitors: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: '获取会议列表失败' },
      { status: 500 }
    );
  }
}
