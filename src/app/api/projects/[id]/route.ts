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
      const isMember = project.members.some((m) => m.userId === session.user.id!);
      if (!isMember) {
        return NextResponse.json({ error: '无权访问' }, { status: 403 });
      }
    }

    const totalTasks = project.tasks.length;
    const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const isClient = session.user.role === 'CLIENT';

    if (isClient) {
      const clientTasks = project.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }));

      const clientAttachments = project.attachments
        .filter((a) => a.isDeliverable)
        .map((a) => ({
          id: a.id,
          fileName: a.fileName,
          mimeType: a.mimeType,
          fileSize: a.fileSize,
          uploadedBy: { name: a.uploadedBy?.name },
          createdAt: a.createdAt,
        }));

      const clientAuditLogs = project.auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        createdAt: log.createdAt,
        user: { name: log.user?.name },
      }));

      const clientViewData = {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        dueDate: project.dueDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        progress,
        totalTasks,
        doneTasks,
        client: {
          id: project.client.id,
          name: project.client.name,
        },
        tasks: clientTasks,
        attachments: clientAttachments,
        auditLogs: clientAuditLogs,
      };

      return NextResponse.json({
        success: true,
        data: clientViewData,
      });
    }

    const totalHours = project.timesheets.reduce((sum, ts) => sum + parseFloat(ts.hours as any), 0);
    const totalCost = project.timesheets.reduce(
      (sum, ts) => sum + parseFloat(ts.hours as any) * parseFloat(ts.hourlyRate as any),
      0
    );

    const internalViewData = {
      ...project,
      progress,
      totalTasks,
      doneTasks,
      totalHours,
      totalCost,
    };

    return NextResponse.json({
      success: true,
      data: internalViewData,
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
        session.user.id!,
        'PROJECT',
        project.id,
        oldProject.status,
        status,
        project.id
      );
    }

    if (Object.keys(rest).length > 0) {
      await logUpdate(
        session.user.id!,
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
