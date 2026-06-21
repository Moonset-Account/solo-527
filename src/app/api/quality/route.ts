import { NextResponse } from 'next/server';
import { qualityService } from '@/services/qualityService';
import { getCurrentUser } from '@/lib/auth';
import { hasPermissionAsync } from '@/lib/permissions';
import type { Role } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!await hasPermissionAsync(user.role as Role, 'quality', 'view')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const result = searchParams.get('result') as 'passed' | 'failed' | undefined;
    const orderId = searchParams.get('orderId') || undefined;

    const data = await qualityService.list({ page, pageSize, result, orderId });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Quality API error:', error);
    return NextResponse.json(
      { error: '获取质检记录失败' },
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

    if (!await hasPermissionAsync(user.role as Role, 'quality', 'create')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const check = await qualityService.create({
      ...body,
      checkedBy: user.id,
    });

    return NextResponse.json(check, { status: 201 });
  } catch (error) {
    console.error('Create quality check API error:', error);
    return NextResponse.json(
      { error: '创建质检记录失败' },
      { status: 500 }
    );
  }
}
