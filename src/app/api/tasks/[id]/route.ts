import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logStatusChange, logUpdate } from '@/lib/audit';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { status, ...rest } = body;

    const oldTask = await prisma.task.findUnique({ where: { id: params.id } });
    if (!oldTask) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...rest,
        status: status || undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
      include: { project: true, assignee: true },
    });

    if (status && status !== oldTask.status) {
      await logStatusChange(
        session.user.id,
        'TASK',
        task.id,
        oldTask.status,
        status,
        task.projectId
      );
    }

    if (Object.keys(rest).length > 0) {
      await logUpdate(
        session.user.id,
        'TASK',
        task.id,
        oldTask,
        rest,
        task.projectId
      );
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error('更新任务失败:', error);
    return NextResponse.json({ error: '更新任务失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    await prisma.task.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除任务失败:', error);
    return NextResponse.json({ error: '删除任务失败' }, { status: 500 });
  }
}
