import { NextResponse } from 'next/server';

const mockPayments = [
  { id: 'pay1', invoiceNumber: 'INV-2024-001', clientName: '阿里巴巴集团', amount: 25000, paymentMethod: 'bank_transfer', paidAt: '2024-01-25', status: 'completed' },
  { id: 'pay2', invoiceNumber: 'INV-2024-002', clientName: '腾讯科技', amount: 35000, paymentMethod: 'alipay', paidAt: '2024-02-01', status: 'completed' },
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

  const csvContent = toCSV(mockPayments);

  if (format === 'csv') {
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="payments_${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ data: mockPayments, count: mockPayments.length });
}
