import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/auth';
import { taskService } from '@/server/services/task.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });

    const task = await taskService.getById(params.id);
    if (!task)
      return NextResponse.json({ success: false, error: '事项不存在' }, { status: 404 });

    if (
      session.role === 'USER' &&
      task.assigneeId !== session.userId &&
      task.creatorId !== session.userId
    ) {
      return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
    }
    return NextResponse.json({ success: true, data: task });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
