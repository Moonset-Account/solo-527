import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerCurrentUser } from '@/lib/auth';

function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('X-User-Id');
  return getServerCurrentUser(userId || undefined);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const roomId = searchParams.get('roomId');
  const user = getUserFromRequest(request);

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
      in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'],
    };

    if (user.role === 'EMPLOYEE') {
      where.departmentId = user.departmentId;
      where.hostId = user.id;
    } else if (user.role === 'RECEPTIONIST') {
      where.departmentId = user.departmentId;
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        room: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
            phone: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
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
