import { NextRequest, NextResponse } from 'next/server';
import { updateMeeting, cancelMeeting } from '@/lib/meeting';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const user = getCurrentUser();

    const meeting = await updateMeeting(params.id, body, user.id);

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新会议失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();
    const result = await cancelMeeting(params.id, user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error cancelling meeting:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '取消会议失败' },
      { status: 500 }
    );
  }
}
