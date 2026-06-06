import { NextResponse } from 'next/server';

const mockQuotes = [
  {
    id: 'q1',
    quoteNumber: 'Q2024010001',
    title: '官网设计项目报价',
    projectId: 'p1',
    projectName: '官网设计项目',
    clientId: 'c1',
    clientName: '阿里巴巴集团',
    clientEmail: 'zhang.manager@alibaba.com',
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
    terms: '付款方式：首付50%，验收后支付尾款',
  },
  {
    id: 'q2',
    quoteNumber: 'Q2024010002',
    title: '品牌VI设计报价',
    projectId: 'p2',
    projectName: '品牌VI设计',
    clientId: 'c2',
    clientName: '腾讯科技',
    clientEmail: 'li.director@tencent.com',
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
    terms: '付款方式：全款预付',
  },
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const quote = mockQuotes.find((q) => q.id === params.id);

  if (!quote) {
    return NextResponse.json({ error: '报价单不存在' }, { status: 404 });
  }

  return NextResponse.json({ quote });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const quoteIndex = mockQuotes.findIndex((q) => q.id === params.id);

  if (quoteIndex === -1) {
    return NextResponse.json({ error: '报价单不存在' }, { status: 404 });
  }

  const body = await request.json();
  mockQuotes[quoteIndex] = { ...mockQuotes[quoteIndex], ...body };

  return NextResponse.json({ quote: mockQuotes[quoteIndex] });
}
