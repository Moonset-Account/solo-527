import { NextResponse } from 'next/server';

type TimeEntry = {
  id: string;
  projectId: string | null;
  projectName: string | null;
  taskName: string;
  description: string;
  durationMinutes: number;
  isBillable: boolean;
  startTime: string;
  endTime: string;
  createdAt: string;
};

const mockTimeEntries: TimeEntry[] = [
  {
    id: 't1',
    projectId: 'p1',
    projectName: '官网设计项目',
    taskName: '首页设计',
    description: '完成首页初稿设计',
    durationMinutes: 240,
    isBillable: true,
    startTime: '2024-02-15T09:00:00.000Z',
    endTime: '2024-02-15T13:00:00.000Z',
    createdAt: '2024-02-15T13:00:00.000Z',
  },
  {
    id: 't2',
    projectId: 'p2',
    projectName: '品牌VI设计',
    taskName: 'Logo方案',
    description: '设计3套Logo方案',
    durationMinutes: 360,
    isBillable: true,
    startTime: '2024-02-14T10:00:00.000Z',
    endTime: '2024-02-14T16:00:00.000Z',
    createdAt: '2024-02-14T16:00:00.000Z',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  let data = [...mockTimeEntries];
  if (projectId) {
    data = data.filter((t) => t.projectId === projectId);
  }

  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newEntry = {
      id: `t${Date.now()}`,
      projectId: body.projectId,
      projectName: body.projectId ? '关联项目' : null,
      taskName: body.taskName || '',
      description: body.description || '',
      durationMinutes: body.durationMinutes || 0,
      isBillable: body.isBillable !== false,
      startTime: body.startTime || new Date().toISOString(),
      endTime: body.endTime || null,
      createdAt: new Date().toISOString(),
    };

    mockTimeEntries.unshift(newEntry);

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
