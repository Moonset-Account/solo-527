import { NextRequest, NextResponse } from 'next/server';
import { getFrontDeskTasks, completeTask, getPendingTasks } from '@/lib/front-desk';
import { getServerCurrentUser } from '@/lib/auth';
import { canManageFrontDesk } from '@/lib/permissions';

function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('X-User-Id');
  return getServerCurrentUser(userId || undefined);
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!canManageFrontDesk(user)) {
      return NextResponse.json(
        { error: '无权限访问前台任务' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as any;
    const pending = searchParams.get('pending') === 'true';

    if (pending) {
      const tasks = await getPendingTasks();
      return NextResponse.json({ tasks });
    }

    const tasks = await getFrontDeskTasks(status);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching front desk tasks:', error);
    return NextResponse.json(
      { error: '获取前台任务失败' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!canManageFrontDesk(user)) {
      return NextResponse.json(
        { error: '无权限操作前台任务' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const task = await completeTask(body.taskId, user.id);

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json(
      { error: '完成任务失败' },
      { status: 500 }
    );
  }
}
