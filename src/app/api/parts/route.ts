import { NextResponse } from 'next/server';
import { partService } from '@/services/partService';
import { getCurrentUser } from '@/lib/auth';
import { hasPermissionAsync } from '@/lib/permissions';
import type { Role } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!await hasPermissionAsync(user.role as Role, 'parts', 'view')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    const result = await partService.list({ page, pageSize, category, search, lowStockOnly });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Parts API error:', error);
    return NextResponse.json(
      { error: '获取配件列表失败' },
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

    if (!await hasPermissionAsync(user.role as Role, 'parts', 'create')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const part = await partService.create(body);

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error('Create part API error:', error);
    return NextResponse.json(
      { error: '创建配件失败' },
      { status: 500 }
    );
  }
}
