import { NextRequest, NextResponse } from 'next/server';
import { grantAccess, revokeAccess, checkAccess, getActiveAccessGrants } from '@/lib/access-control';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const visitorId = searchParams.get('visitorId');
    const roomId = searchParams.get('roomId');

    if (visitorId && roomId) {
      const hasAccess = await checkAccess(visitorId, roomId);
      return NextResponse.json({ hasAccess });
    }

    if (visitorId) {
      const grants = await getActiveAccessGrants(visitorId);
      return NextResponse.json({ grants });
    }

    return NextResponse.json(
      { error: '缺少必要参数' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error checking access:', error);
    return NextResponse.json(
      { error: '检查门禁权限失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = getCurrentUser();

    const grant = await grantAccess(
      body.visitorId,
      body.meetingId,
      new Date(body.startTime),
      new Date(body.endTime),
      user.id
    );

    return NextResponse.json({ grant });
  } catch (error) {
    console.error('Error granting access:', error);
    return NextResponse.json(
      { error: '授权门禁失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const user = getCurrentUser();

    await revokeAccess(body.grantId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking access:', error);
    return NextResponse.json(
      { error: '撤销门禁失败' },
      { status: 500 }
    );
  }
}
