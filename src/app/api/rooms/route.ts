import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const onlyActive = searchParams.get('onlyActive') !== 'false';

    const rooms = await prisma.meetingRoom.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error fetching meeting rooms:', error);
    return NextResponse.json(
      { error: '获取会议室列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const room = await prisma.meetingRoom.create({
      data: {
        name: body.name,
        location: body.location,
        capacity: body.capacity,
      },
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error creating meeting room:', error);
    return NextResponse.json(
      { error: '创建会议室失败' },
      { status: 500 }
    );
  }
}
