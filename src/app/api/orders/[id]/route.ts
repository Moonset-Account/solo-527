import { NextResponse } from 'next/server';
import { orderService } from '@/services/orderService';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import type { Role } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!hasPermission(user.role as Role, 'orders', 'view')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const order = await orderService.getById(params.id);
    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Get order API error:', error);
    return NextResponse.json(
      { error: '获取订单详情失败' },
      { status: 500 }
    );
  }
}
