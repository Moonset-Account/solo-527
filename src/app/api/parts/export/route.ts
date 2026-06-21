import { NextResponse } from 'next/server';
import { partService } from '@/services/partService';
import { getCurrentUser } from '@/lib/auth';
import { hasPermissionAsync } from '@/lib/permissions';
import type { Role } from '@prisma/client';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!await hasPermissionAsync(user.role as Role, 'inventory', 'export')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') as 'xlsx' | 'csv') || 'xlsx';

    const data = await partService.exportParts(format);

    if (format === 'xlsx') {
      return new NextResponse(data as Buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="parts-${new Date().toISOString().slice(0, 10)}.xlsx"`,
        },
      });
    }

    return new NextResponse(data as Buffer, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="parts-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export parts API error:', error);
    return NextResponse.json(
      { error: '导出配件数据失败' },
      { status: 500 }
    );
  }
}
