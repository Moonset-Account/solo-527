import { NextResponse } from 'next/server';
import { z } from 'zod';

type InvoiceItem = {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  title: string;
  projectId: string | null;
  projectName: string | null;
  clientId: string | null;
  clientName: string | null;
  clientEmail: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  paidAt: string | null;
  items: InvoiceItem[];
  notes: string;
  terms: string;
};

const mockInvoices: Invoice[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV2024020001',
    title: '官网设计-首付款',
    projectId: 'p1',
    projectName: '官网设计项目',
    clientId: 'c1',
    clientName: '阿里巴巴集团',
    clientEmail: 'zhang.manager@alibaba.com',
    totalAmount: 25000,
    paidAmount: 25000,
    status: 'paid',
    dueDate: '2024-02-15T00:00:00.000Z',
    createdAt: '2024-02-01T00:00:00.000Z',
    paidAt: '2024-02-15T10:30:00.000Z',
    items: [
      { id: 1, name: '首付款（50%）', quantity: 1, unitPrice: 25000, amount: 25000 },
    ],
    notes: '项目首付款',
    terms: '请在到期日前付款',
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV2024020002',
    title: '品牌VI设计-全款',
    projectId: 'p2',
    projectName: '品牌VI设计',
    clientId: 'c2',
    clientName: '腾讯科技',
    clientEmail: 'li.director@tencent.com',
    totalAmount: 30000,
    paidAmount: 0,
    status: 'sent',
    dueDate: '2024-02-20T00:00:00.000Z',
    createdAt: '2024-02-05T00:00:00.000Z',
    paidAt: null,
    items: [
      { id: 1, name: 'Logo设计', quantity: 1, unitPrice: 10000, amount: 10000 },
      { id: 2, name: '色彩规范', quantity: 1, unitPrice: 5000, amount: 5000 },
      { id: 3, name: '应用设计', quantity: 10, unitPrice: 1500, amount: 15000 },
    ],
    notes: '',
    terms: '请在到期日前付款',
  },
  {
    id: 'inv3',
    invoiceNumber: 'INV2024010003',
    title: '旧项目收尾款',
    projectId: 'p3',
    projectName: 'Logo设计项目',
    clientId: 'c4',
    clientName: '美团点评',
    clientEmail: 'zhao.design@meituan.com',
    totalAmount: 15000,
    paidAmount: 0,
    status: 'overdue',
    dueDate: '2024-01-30T00:00:00.000Z',
    createdAt: '2024-01-15T00:00:00.000Z',
    paidAt: null,
    items: [
      { id: 1, name: '项目尾款', quantity: 1, unitPrice: 15000, amount: 15000 },
    ],
    notes: '已逾期，请尽快付款',
    terms: '请在到期日前付款',
  },
];

const createInvoiceSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  dueDate: z.string().optional().nullable(),
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

  let invoices = [...mockInvoices];

  if (status) {
    invoices = invoices.filter((i) => i.status === status);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    invoices = invoices.filter(
      (i) =>
        i.title.toLowerCase().includes(searchLower) ||
        i.invoiceNumber.toLowerCase().includes(searchLower) ||
        i.projectName?.toLowerCase().includes(searchLower)
    );
  }

  return NextResponse.json({ invoices, total: invoices.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createInvoiceSchema.parse(body);

    const totalAmount = validated.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const newInvoice = {
      id: `inv${Date.now()}`,
      invoiceNumber: `INV${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(mockInvoices.length + 1).padStart(4, '0')}`,
      title: validated.title,
      projectId: validated.projectId || null,
      projectName: validated.projectId ? '新建项目' : null,
      clientId: validated.clientId || null,
      clientName: validated.clientId ? '新建客户' : null,
      clientEmail: '',
      totalAmount,
      paidAmount: 0,
      status: 'draft' as const,
      dueDate: validated.dueDate || null,
      createdAt: new Date().toISOString(),
      paidAt: null,
      items: validated.items.map((item, idx) => ({
        id: idx + 1,
        ...item,
        amount: item.quantity * item.unitPrice,
      })),
      notes: validated.notes || '',
      terms: '请在到期日前付款',
    };

    mockInvoices.unshift(newInvoice);

    return NextResponse.json({ invoice: newInvoice }, { status: 201 });
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
