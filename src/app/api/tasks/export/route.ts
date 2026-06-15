import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/lib/auth';
import { statisticsService } from '@/server/services/statistics.service';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['ADMIN', 'ADMIN_LEAD']);
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') as 'csv' | 'xlsx') || 'csv';
    const options = {
      format,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const rows = await statisticsService.exportTasks(options);
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('周会事项记录');
      if (rows.length > 0) {
        sheet.columns = Object.keys(rows[0]).map((k) => ({
          header: k,
          key: k,
          width: 18,
        }));
        rows.forEach((r: any) => sheet.addRow(r));
        sheet.getRow(1).font = { bold: true };
      }
      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="weekly-tasks-${dateStr}.xlsx"`,
        },
      });
    }

    const parser = new Parser();
    const csv = rows.length > 0 ? parser.parse(rows) : '';
    return new NextResponse('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="weekly-tasks-${dateStr}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
