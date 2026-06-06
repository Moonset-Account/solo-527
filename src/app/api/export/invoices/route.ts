import { NextResponse } from 'next/server';

const mockInvoices = [
  { id: 'inv1', invoiceNumber: 'INV-2024-001', clientName: '阿里巴巴集团', title: '官网设计项目', totalAmount: 50000, paidAmount: 25000, status: 'partial', dueDate: '2024-02-15' },
  { id: 'inv2', invoiceNumber: 'INV-2024-002', clientName: '腾讯科技', title: 'APP UI 设计', totalAmount: 35000, paidAmount: 35000, status: 'paid', dueDate: '2024-02-20' },
  { id: 'inv3', invoiceNumber: 'INV-2024-003', clientName: '字节跳动', title: '品牌视觉设计', totalAmount: 80000, paidAmount: 0, status: 'sent', dueDate: '2024-02-28' },
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

  const csvContent = toCSV(mockInvoices);

  if (format === 'csv') {
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="invoices_${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ data: mockInvoices, count: mockInvoices.length });
}
