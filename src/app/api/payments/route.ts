import { NextResponse } from 'next/server';
import { z } from 'zod';

type Payment = {
  id: string;
  transactionId: string;
  amount: number;
  method: string;
  status: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  projectId: string | null;
  projectName: string | null;
  clientId: string | null;
  clientName: string | null;
  description: string;
  paidAt: string;
};

const mockPayments: Payment[] = [
  {
    id: 'pay1',
    transactionId: 'TXN20240215001',
    amount: 25000,
    method: 'bank_transfer',
    status: 'completed',
    invoiceId: 'inv1',
    invoiceNumber: 'INV2024020001',
    projectId: 'p1',
    projectName: '官网设计项目',
    clientId: 'c1',
    clientName: '阿里巴巴集团',
    description: '官网设计项目首付款',
    paidAt: '2024-02-15T10:30:00.000Z',
  },
  {
    id: 'pay2',
    transactionId: 'TXN20240210002',
    amount: 15000,
    method: 'alipay',
    status: 'completed',
    invoiceId: null,
    invoiceNumber: null,
    projectId: 'p2',
    projectName: '品牌VI设计',
    clientId: 'c2',
    clientName: '腾讯科技',
    description: '品牌VI设计预付款',
    paidAt: '2024-02-10T14:20:00.000Z',
  },
];

const createPaymentSchema = z.object({
  amount: z.number().min(0.01, '金额必须大于0'),
  method: z.enum(['bank_transfer', 'alipay', 'wechat', 'cash', 'credit_card']),
  invoiceId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  description: z.string().optional(),
  paidAt: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let payments = [...mockPayments];

  if (status) {
    payments = payments.filter((p) => p.status === status);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    payments = payments.filter(
      (p) =>
        p.description.toLowerCase().includes(searchLower) ||
        p.transactionId.toLowerCase().includes(searchLower) ||
        p.projectName?.toLowerCase().includes(searchLower)
    );
  }

  return NextResponse.json({ payments, total: payments.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createPaymentSchema.parse(body);

    const newPayment = {
      id: `pay${Date.now()}`,
      transactionId: `TXN${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(mockPayments.length + 1).padStart(5, '0')}`,
      amount: validated.amount,
      method: validated.method,
      status: 'completed' as const,
      invoiceId: validated.invoiceId || null,
      invoiceNumber: validated.invoiceId ? '关联发票' : null,
      projectId: validated.projectId || null,
      projectName: validated.projectId ? '关联项目' : null,
      clientId: validated.clientId || null,
      clientName: validated.clientId ? '关联客户' : null,
      description: validated.description || '',
      paidAt: validated.paidAt || new Date().toISOString(),
    };

    mockPayments.unshift(newPayment);

    return NextResponse.json({ payment: newPayment }, { status: 201 });
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
