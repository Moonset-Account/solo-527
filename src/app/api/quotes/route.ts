import { NextResponse } from 'next/server';
import { z } from 'zod';

type QuoteItem = {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type Quote = {
  id: string;
  quoteNumber: string;
  title: string;
  projectId: string | null;
  projectName: string | null;
  clientId: string | null;
  clientName: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  validUntil: string | null;
  description: string;
  items: QuoteItem[];
  notes: string;
};

const mockQuotes: Quote[] = [
  {
    id: 'q1',
    quoteNumber: 'Q2024010001',
    title: '官网设计项目报价',
    projectId: 'p1',
    projectName: '官网设计项目',
    clientId: 'c1',
    clientName: '阿里巴巴集团',
    totalAmount: 50000,
    status: 'accepted',
    createdAt: '2024-01-10T00:00:00.000Z',
    validUntil: '2024-02-15T00:00:00.000Z',
    description: '企业官网全案设计，包含首页、产品页、关于我们等15个页面设计',
    items: [
      { id: 1, name: '首页设计', quantity: 1, unitPrice: 8000, amount: 8000 },
      { id: 2, name: '产品页面设计', quantity: 5, unitPrice: 4000, amount: 20000 },
      { id: 3, name: '关于我们页面', quantity: 3, unitPrice: 3000, amount: 9000 },
      { id: 4, name: '响应式适配', quantity: 1, unitPrice: 13000, amount: 13000 },
    ],
    notes: '包含2轮修改',
  },
  {
    id: 'q2',
    quoteNumber: 'Q2024010002',
    title: '品牌VI设计报价',
    projectId: 'p2',
    projectName: '品牌VI设计',
    clientId: 'c2',
    clientName: '腾讯科技',
    totalAmount: 30000,
    status: 'sent',
    createdAt: '2024-01-15T00:00:00.000Z',
    validUntil: '2024-02-01T00:00:00.000Z',
    description: '品牌视觉识别系统设计',
    items: [
      { id: 1, name: 'Logo设计', quantity: 1, unitPrice: 10000, amount: 10000 },
      { id: 2, name: '色彩规范', quantity: 1, unitPrice: 5000, amount: 5000 },
      { id: 3, name: '应用设计', quantity: 10, unitPrice: 1500, amount: 15000 },
    ],
    notes: '包含3套方案',
  },
  {
    id: 'q3',
    quoteNumber: 'Q2024010003',
    title: '移动App UI设计报价',
    projectId: 'p3',
    projectName: '移动App设计',
    clientId: 'c3',
    clientName: '字节跳动',
    totalAmount: 80000,
    status: 'draft',
    createdAt: '2024-01-20T00:00:00.000Z',
    validUntil: null,
    description: 'iOS和Android双平台UI设计',
    items: [
      { id: 1, name: '登录注册流程', quantity: 5, unitPrice: 3000, amount: 15000 },
      { id: 2, name: '首页设计', quantity: 1, unitPrice: 8000, amount: 8000 },
      { id: 3, name: '功能页面', quantity: 20, unitPrice: 2500, amount: 50000 },
      { id: 4, name: '图标设计', quantity: 30, unitPrice: 200, amount: 6000 },
    ],
    notes: '待确认',
  },
];

const createQuoteSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  validUntil: z.string().optional().nullable(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
    })
  ),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let quotes = [...mockQuotes];

  if (status) {
    quotes = quotes.filter((q) => q.status === status);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    quotes = quotes.filter(
      (q) =>
        q.title.toLowerCase().includes(searchLower) ||
        q.quoteNumber.toLowerCase().includes(searchLower) ||
        q.projectName?.toLowerCase().includes(searchLower)
    );
  }

  return NextResponse.json({ quotes, total: quotes.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createQuoteSchema.parse(body);

    const totalAmount = validated.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const newQuote = {
      id: `q${Date.now()}`,
      quoteNumber: `Q${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(mockQuotes.length + 1).padStart(4, '0')}`,
      title: validated.title,
      projectId: validated.projectId || null,
      projectName: validated.projectId ? '新建项目' : null,
      clientId: validated.clientId || null,
      clientName: validated.clientId ? '新建客户' : null,
      totalAmount,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      validUntil: validated.validUntil || null,
      description: '',
      items: validated.items.map((item, idx) => ({
        id: idx + 1,
        ...item,
        amount: item.quantity * item.unitPrice,
      })),
      notes: validated.notes || '',
    };

    mockQuotes.unshift(newQuote);

    return NextResponse.json({ quote: newQuote }, { status: 201 });
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
