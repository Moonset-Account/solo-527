import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireRole } from '@/server/lib/auth';
import { logService } from '@/server/services/log.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const isAdmin = ['ADMIN', 'ADMIN_LEAD'].includes(session.role);

    const options: any = {
      page: Number(searchParams.get('page') || '1'),
      pageSize: Number(searchParams.get('pageSize') || '30'),
      action: searchParams.get('action') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
    };

    if (!isAdmin) options.operatorId = session.userId;
    if (isAdmin) options.taskId = searchParams.get('taskId') || undefined;
    if (isAdmin) options.operatorId = searchParams.get('operatorId') || undefined;

    const data = await logService.list(options);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
