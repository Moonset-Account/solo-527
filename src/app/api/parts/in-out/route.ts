import { NextResponse } from 'next/server';
import { partService } from '@/services/partService';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import type { Role } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!hasPermission(user.role as Role, 'inventory', 'view')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const partId = searchParams.get('partId') || undefined;
    const type = searchParams.get('type') as 'in' | 'out' | 'adjust' | 'check' | undefined;

    const result = await partService.stockRecords({ page, pageSize, partId, type });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Stock records API error:', error);
    return NextResponse.json(
      { error: '获取出入库记录失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!hasPermission(user.role as Role, 'inventory', 'create')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { partId, type, quantity, orderId, remark } = body;

    let result;
    if (type === 'in') {
      result = await partService.stockIn(partId, quantity, user.id, orderId, remark);
    } else if (type === 'out') {
      result = await partService.stockOut(partId, quantity, user.id, orderId, remark);
    } else {
      return NextResponse.json({ error: '无效的操作类型' }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Stock record API error:', error);
    return NextResponse.json(
      { error: (error as Error).message || '操作失败' },
      { status: 500 }
    );
  }
}
