import { NextRequest, NextResponse } from 'next/server';
import { createMeeting } from '@/lib/meeting';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = getCurrentUser();

    const meeting = await createMeeting(
      {
        title: body.title,
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        hostId: user.id,
        departmentId: user.departmentId!,
        roomId: body.roomId,
        visitors: body.visitors || [],
      },
      user.id
    );

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建会议失败' },
      { status: 500 }
    );
  }
}
