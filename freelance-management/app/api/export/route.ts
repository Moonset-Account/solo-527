import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import * as statsService from '@/lib/services/statsService';
import { Role } from '@/types';

export const GET = requireAuth(async (request: NextRequest, user) => {
  if (user.role === Role.CLIENT) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  
  const type = request.nextUrl.searchParams.get('type');
  const startDate = request.nextUrl.searchParams.get('start_date') || undefined;
  const endDate = request.nextUrl.searchParams.get('end_date') || undefined;
  
  let buffer: Buffer;
  let filename: string;
  
  switch (type) {
    case 'invoices':
      buffer = statsService.exportInvoicesToExcel();
      filename = `发票列表_${new Date().toISOString().split('T')[0]}.xlsx`;
      break;
    case 'time-entries':
      buffer = statsService.exportTimeEntriesToExcel(startDate, endDate);
      filename = `工时记录_${new Date().toISOString().split('T')[0]}.xlsx`;
      break;
    case 'revenue':
      buffer = statsService.exportRevenueReport();
      filename = `收入报告_${new Date().toISOString().split('T')[0]}.xlsx`;
      break;
    default:
      return NextResponse.json({ error: '无效的导出类型' }, { status: 400 });
  }
  
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});
