import { NextResponse } from 'next/server';

const mockProjects = [
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
    tasks: [
      { id: 't1', name: '需求分析', status: 'completed', progress: 100 },
      { id: 't2', name: '设计初稿', status: 'completed', progress: 100 },
      { id: 't3', name: '设计修改', status: 'in_progress', progress: 50 },
      { id: 't4', name: '最终交付', status: 'pending', progress: 0 },
    ],
  },
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const project = mockProjects.find((p) => p.id === params.id);

  if (!project) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const projectIndex = mockProjects.findIndex((p) => p.id === params.id);

  if (projectIndex === -1) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }

  const body = await request.json();
  mockProjects[projectIndex] = { ...mockProjects[projectIndex], ...body };

  return NextResponse.json(mockProjects[projectIndex]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const projectIndex = mockProjects.findIndex((p) => p.id === params.id);

  if (projectIndex === -1) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }

  mockProjects.splice(projectIndex, 1);

  return NextResponse.json({ success: true });
}
