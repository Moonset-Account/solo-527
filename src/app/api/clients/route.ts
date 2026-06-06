import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logCreate } from '@/lib/audit';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      include: {
        _count: { select: { projects: true, invoices: true } },
        projects: {
          select: {
            budget: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    console.error('获取客户列表失败:', error);
    return NextResponse.json({ error: '获取客户列表失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, address, contactPerson } = body;

    if (!name) {
      return NextResponse.json({ error: '客户名称必填' }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: { name, email, phone, address, contactPerson },
    });

    await logCreate(session.user.id!, 'CLIENT', client.id, body);

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error('创建客户失败:', error);
    return NextResponse.json({ error: '创建客户失败' }, { status: 500 });
  }
}
