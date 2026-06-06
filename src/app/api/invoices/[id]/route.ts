import { NextResponse } from 'next/server';

const mockInvoices = [
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
    payments: [
      { id: 'pay1', amount: 25000, method: 'bank_transfer', paidAt: '2024-02-15T10:30:00.000Z' },
    ],
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
    payments: [],
  },
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const invoice = mockInvoices.find((i) => i.id === params.id);

  if (!invoice) {
    return NextResponse.json({ error: '发票不存在' }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const invoiceIndex = mockInvoices.findIndex((i) => i.id === params.id);

  if (invoiceIndex === -1) {
    return NextResponse.json({ error: '发票不存在' }, { status: 404 });
  }

  const body = await request.json();
  mockInvoices[invoiceIndex] = { ...mockInvoices[invoiceIndex], ...body };

  return NextResponse.json({ invoice: mockInvoices[invoiceIndex] });
}
