import { NextRequest, NextResponse } from 'next/server';
import { validateVisitorToken, getActiveVisitorToken, refreshVisitorToken } from '@/lib/visitor-token';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const tokenData = await validateVisitorToken(body.token);

    if (!tokenData) {
      return NextResponse.json(
        { valid: false, error: '无效或已过期的令牌' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      visitor: tokenData.visitor,
    });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { error: '验证令牌失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const visitorId = searchParams.get('visitorId');

    if (!visitorId) {
      return NextResponse.json(
        { error: '缺少 visitorId 参数' },
        { status: 400 }
      );
    }

    const token = await getActiveVisitorToken(visitorId);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error getting token:', error);
    return NextResponse.json(
      { error: '获取令牌失败' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const user = getCurrentUser();

    const visitor = await prisma.visitor.findUnique({
      where: { id: body.visitorId },
      include: { meeting: true },
    });

    if (!visitor) {
      return NextResponse.json(
        { error: '访客不存在' },
        { status: 404 }
      );
    }

    const newToken = await refreshVisitorToken(
      body.visitorId,
      visitor.meeting.endTime,
      user.id
    );

    return NextResponse.json({ token: newToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: '刷新令牌失败' },
      { status: 500 }
    );
  }
}
