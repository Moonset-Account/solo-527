import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireRole } from '@/server/lib/auth';
import { userService } from '@/server/services/user.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const simple = searchParams.get('simple') === 'true';
    const isAdmin = ['ADMIN', 'ADMIN_LEAD'].includes(session.role);

    if (simple) {
      const data = await userService.listAllSimple();
      return NextResponse.json({ success: true, data });
    }

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      );
    }

    const options = {
      page: Number(searchParams.get('page') || '1'),
      pageSize: Number(searchParams.get('pageSize') || '20'),
      keyword: searchParams.get('keyword') || undefined,
      role: searchParams.get('role') || undefined,
      department: searchParams.get('department') || undefined,
    };
    const data = await userService.list(options);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['ADMIN']);
    const body = await request.json();
    const result = await userService.create({ ...body, operatorId: session.userId });
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
