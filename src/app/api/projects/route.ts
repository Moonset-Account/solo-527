import { NextResponse } from 'next/server';

type Project = {
  id: string;
  name: string;
  clientId: string | null;
  clientName: string | null;
  description: string;
  status: string;
  progress: number;
  totalAmount: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

const mockProjects: Project[] = [
  {
    id: 'p1',
    name: '官网设计项目',
    clientId: 'c1',
    clientName: '阿里巴巴集团',
    description: '企业官网全案设计，包含15个页面',
    status: 'in_progress',
    progress: 75,
    totalAmount: 50000,
    startDate: '2024-01-10T00:00:00.000Z',
    endDate: null,
    createdAt: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 'p2',
    name: '品牌VI设计',
    clientId: 'c2',
    clientName: '腾讯科技',
    description: '品牌视觉识别系统设计',
    status: 'review',
    progress: 90,
    totalAmount: 30000,
    startDate: '2024-01-15T00:00:00.000Z',
    endDate: null,
    createdAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'p3',
    name: '移动App UI设计',
    clientId: 'c3',
    clientName: '字节跳动',
    description: 'iOS和Android双平台UI设计',
    status: 'planning',
    progress: 20,
    totalAmount: 80000,
    startDate: '2024-01-20T00:00:00.000Z',
    endDate: null,
    createdAt: '2024-01-20T00:00:00.000Z',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let projects = [...mockProjects];

  if (status) {
    projects = projects.filter((p) => p.status === status);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    projects = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        (p.clientName && p.clientName.toLowerCase().includes(searchLower))
    );
  }

  return NextResponse.json({ data: projects, total: projects.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newProject = {
      id: `p${Date.now()}`,
      name: body.name,
      clientId: body.clientId || null,
      clientName: body.clientId ? '新建客户' : null,
      description: body.description || '',
      status: 'planning' as const,
      progress: 0,
      totalAmount: body.totalAmount || 0,
      startDate: body.startDate || new Date().toISOString(),
      endDate: body.endDate || null,
      createdAt: new Date().toISOString(),
    };

    mockProjects.unshift(newProject);

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
