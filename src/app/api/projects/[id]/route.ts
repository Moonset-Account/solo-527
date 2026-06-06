import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logStatusChange, logUpdate } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true } },
            _count: { select: { timesheets: true } },
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        timesheets: {
          include: { user: { select: { name: true } } },
          orderBy: { workDate: 'desc' },
        },
        attachments: {
          include: { uploadedBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (session.user.role === 'CLIENT' && project.clientId !== session.user.clientId) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }

    if (session.user.role === 'DESIGNER') {
      const isMember = project.members.some((m) => m.userId === session.user.id);
      if (!isMember) {
        return NextResponse.json({ error: '无权访问' }, { status: 403 });
      }
    }

    const totalTasks = project.tasks.length;
    const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const totalHours = project.timesheets.reduce((sum, ts) => sum + parseFloat(ts.hours as any), 0);
    const totalCost = project.timesheets.reduce(
      (sum, ts) => sum + parseFloat(ts.hours as any) * parseFloat(ts.hourlyRate as any),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        progress,
        totalHours,
        totalCost,
      },
    });
  } catch (error) {
    console.error('获取项目详情失败:', error);
    return NextResponse.json({ error: '获取项目详情失败' }, { status: 500 });
  }
}

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

    const oldProject = await prisma.project.findUnique({ where: { id: params.id } });
    if (!oldProject) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...rest,
        status: status || undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
      },
      include: { client: true },
    });

    if (status && status !== oldProject.status) {
      await logStatusChange(
        session.user.id,
        'PROJECT',
        project.id,
        oldProject.status,
        status,
        project.id
      );
    }

    if (Object.keys(rest).length > 0) {
      await logUpdate(
        session.user.id,
        'PROJECT',
        project.id,
        oldProject,
        rest,
        project.id
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error('更新项目失败:', error);
    return NextResponse.json({ error: '更新项目失败' }, { status: 500 });
  }
}
