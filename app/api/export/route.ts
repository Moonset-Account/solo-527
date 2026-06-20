import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { exportSchema } from '@/lib/validation';
import { exportToExcel, exportToCSV } from '@/lib/export';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = exportSchema.parse(body);

    let buffer: Buffer;
    let filename: string;
    let mimeType: string;

    const timestamp = new Date().toISOString().slice(0, 10);

    if (data.format === 'xlsx') {
      buffer = await exportToExcel(data.type, data.filters);
      filename = `${data.type}_${timestamp}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      buffer = await exportToCSV(data.type, data.filters);
      filename = `${data.type}_${timestamp}.csv`;
      mimeType = 'text/csv; charset=utf-8';
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '参数校验失败',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('导出API错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '导出失败',
      },
      { status: 500 }
    );
  }
}
