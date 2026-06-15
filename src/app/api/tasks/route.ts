import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireRole } from '@/server/lib/auth';
import { taskService } from '@/server/services/task.service';
import type { TaskFilter } from '@/server/services/task.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filter: TaskFilter = {
      status: (searchParams.get('status') as any) || undefined,
      priority: (searchParams.get('priority') as any) || undefined,
      keyword: searchParams.get('keyword') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      page: Number(searchParams.get('page') || '1'),
      pageSize: Number(searchParams.get('pageSize') || '20'),
    };

    const assigneeParam = searchParams.get('assigneeId');
    if (assigneeParam === 'unassigned') filter.assigneeId = 'unassigned';
    else if (assigneeParam) filter.assigneeId = assigneeParam;
    else if (session.role === 'USER') filter.assigneeId = session.userId;

    const showMine = searchParams.get('mine');
    if (showMine === 'true') filter.assigneeId = session.userId;

    const data = await taskService.list(filter);
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
    const session = await requireRole(['ADMIN', 'ADMIN_LEAD']);
    const body = await request.json();
    const task = await taskService.create({ ...body, creatorId: session.userId });
    return NextResponse.json({ success: true, data: task });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
