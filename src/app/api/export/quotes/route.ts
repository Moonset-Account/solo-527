import { NextResponse } from 'next/server';

const mockQuotes = [
  { id: 'q1', quoteNumber: 'Q-2024-001', clientName: '阿里巴巴集团', title: '官网设计项目', totalAmount: 50000, status: 'accepted', createdAt: '2024-01-15' },
  { id: 'q2', quoteNumber: 'Q-2024-002', clientName: '腾讯科技', title: 'APP UI 设计', totalAmount: 35000, status: 'sent', createdAt: '2024-01-20' },
  { id: 'q3', quoteNumber: 'Q-2024-003', clientName: '字节跳动', title: '品牌视觉设计', totalAmount: 80000, status: 'draft', createdAt: '2024-02-01' },
];

function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const headerLine = headers.join(',');
  const lines = data.map((row) =>
    headers.map((h) => {
      const value = String(row[h] ?? '');
      return value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );
  return [headerLine, ...lines].join('\n');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';

  const csvContent = toCSV(mockQuotes);

  if (format === 'csv') {
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="quotes_${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ data: mockQuotes, count: mockQuotes.length });
}
