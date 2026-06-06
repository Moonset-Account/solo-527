import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logCreate, logStatusChange } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    const clientId = searchParams.get('clientId');
    const startDateFrom = searchParams.get('startDateFrom');
    const startDateTo = searchParams.get('startDateTo');

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (clientId) {
      where.clientId = clientId;
    }
    if (startDateFrom) {
      where.startDate = { ...where.startDate, gte: new Date(startDateFrom) };
    }
    if (startDateTo) {
      where.startDate = { ...where.startDate, lte: new Date(startDateTo) };
    }
    if (assigneeId) {
      where.members = { some: { userId: assigneeId } };
    }

    if (session.user.role === 'CLIENT' && session.user.clientId) {
      where.clientId = session.user.clientId;
    }

    if (session.user.role === 'DESIGNER') {
      where.members = { ...where.members, some: { userId: session.user.id! } };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        _count: { select: { tasks: true } },
        tasks: {
          select: { status: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const projectsWithProgress = projects.map((project) => {
      const totalTasks = project.tasks.length;
      const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      return {
        ...project,
        progress,
        tasks: undefined,
      };
    });

    return NextResponse.json({ success: true, data: projectsWithProgress });
  } catch (error) {
    console.error('获取项目失败:', error);
    return NextResponse.json({ error: '获取项目失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, clientId, budget, dueDate, assigneeIds, startDate } = body;

    if (!name || !clientId || budget === undefined) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name,
          description,
          clientId,
          budget,
          dueDate: dueDate ? new Date(dueDate) : null,
          startDate: startDate ? new Date(startDate) : null,
          members: {
            create: assigneeIds?.map((userId: string) => ({
              userId,
              role: userId === session.user.id! ? 'MANAGER' : 'MEMBER',
            })) || [],
          },
        },
        include: {
          client: true,
          members: { include: { user: true } },
        },
      });

      await logCreate(
        session.user.id!,
        'PROJECT',
        newProject.id,
        { name, clientId, budget },
        newProject.id
      );

      return newProject;
    });

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json({ error: '创建项目失败' }, { status: 500 });
  }
}
