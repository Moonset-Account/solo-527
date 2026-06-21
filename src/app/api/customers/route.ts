import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import type { Role } from '@prisma/client';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!hasPermission(user.role as Role, 'customers', 'view')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const customers = await prisma.customer.findMany({
      include: {
        vehicles: { select: { id: true, plateNumber: true, brand: true, model: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json({ error: '获取客户列表失败' }, { status: 500 });
  }
}
