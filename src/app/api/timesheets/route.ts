import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logCreate } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};

    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;
    if (dateFrom) where.workDate = { ...where.workDate, gte: new Date(dateFrom) };
    if (dateTo) where.workDate = { ...where.workDate, lte: new Date(dateTo) };

    if (session.user.role === 'DESIGNER') {
      where.userId = session.user.id;
    }

    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { workDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: timesheets });
  } catch (error) {
    console.error('获取工时记录失败:', error);
    return NextResponse.json({ error: '获取工时记录失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, taskId, description, hours, date, hourlyRate } = body;

    if (!projectId || !hours || !date) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    const timesheet = await prisma.timesheet.create({
      data: {
        userId: session.user.id,
        projectId,
        taskId: taskId || null,
        description,
        hours,
        hourlyRate: hourlyRate || 0,
        workDate: new Date(date),
      },
      include: {
        user: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    await logCreate(
      session.user.id,
      'TIMESHEET',
      timesheet.id,
      { projectId, hours, date },
      projectId
    );

    return NextResponse.json({ success: true, data: timesheet });
  } catch (error) {
    console.error('创建工时记录失败:', error);
    return NextResponse.json({ error: '创建工时记录失败' }, { status: 500 });
  }
}
