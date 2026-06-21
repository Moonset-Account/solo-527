import { NextResponse } from 'next/server';
import { orderService } from '@/services/orderService';
import { getCurrentUser } from '@/lib/auth';
import { hasPermissionAsync } from '@/lib/permissions';
import type { Role, OrderStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!await hasPermissionAsync(user.role as Role, 'orders', 'view')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') as OrderStatus | undefined;
    const search = searchParams.get('search') || undefined;

    const result = await orderService.list({ page, pageSize, status, search });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: '获取订单列表失败' },
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

    if (!await hasPermissionAsync(user.role as Role, 'orders', 'create')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const order = await orderService.create({
      ...body,
      createdBy: user.id,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Create order API error:', error);
    return NextResponse.json(
      { error: '创建订单失败' },
      { status: 500 }
    );
  }
}
