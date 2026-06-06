import { NextResponse } from 'next/server';
import { z } from 'zod';

const mockClients = [
  {
    id: 'c1',
    name: '张经理',
    company: '阿里巴巴集团',
    email: 'zhang.manager@alibaba.com',
    phone: '138****8888',
    address: '杭州市余杭区文一西路969号',
    totalRevenue: 180000,
    activeProjects: 2,
    completedProjects: 5,
    status: 'active',
    createdAt: '2023-06-15T00:00:00.000Z',
    notes: '重要客户，优先响应',
  },
  {
    id: 'c2',
    name: '李总监',
    company: '腾讯科技',
    email: 'li.director@tencent.com',
    phone: '139****6666',
    address: '深圳市南山区科技园',
    totalRevenue: 120000,
    activeProjects: 1,
    completedProjects: 3,
    status: 'active',
    createdAt: '2023-08-20T00:00:00.000Z',
    notes: '',
  },
  {
    id: 'c3',
    name: '王产品',
    company: '字节跳动',
    email: 'wang.product@bytedance.com',
    phone: '137****5555',
    address: '北京市海淀区知春路',
    totalRevenue: 95000,
    activeProjects: 2,
    completedProjects: 2,
    status: 'active',
    createdAt: '2023-10-10T00:00:00.000Z',
    notes: '',
  },
];

const createClientSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  company: z.string().optional(),
  email: z.string().email('请输入有效的邮箱'),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let clients = [...mockClients];

  if (status) {
    clients = clients.filter((c) => c.status === status);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    clients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.company?.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower)
    );
  }

  return NextResponse.json({ clients, total: clients.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createClientSchema.parse(body);

    const newClient = {
      id: `c${Date.now()}`,
      name: validated.name,
      company: validated.company || '',
      email: validated.email,
      phone: validated.phone || '',
      address: validated.address || '',
      totalRevenue: 0,
      activeProjects: 0,
      completedProjects: 0,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      notes: validated.notes || '',
    };

    mockClients.unshift(newClient);

    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || '参数错误' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
