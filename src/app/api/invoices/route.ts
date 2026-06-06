import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNumber } from '@/lib/utils';
import { logCreate } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    if (session.user.role === 'CLIENT' && session.user.clientId) {
      where.clientId = session.user.clientId;
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: '未授权' }, { status: 403 });
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    console.error('获取发票列表失败:', error);
    return NextResponse.json({ error: '获取发票列表失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, clientId, items, taxRate = 0, dueDate, notes, issueDate } = body;

    if (!projectId || !clientId || !items || !dueDate) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        projectId,
        clientId,
        subtotal,
        taxRate,
        taxAmount,
        total,
        issueDate: new Date(issueDate || new Date()),
        dueDate: new Date(dueDate),
        notes,
        items: {
          create: items.map((item: any, index: number) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            sortOrder: index,
          })),
        },
      },
      include: { client: true, project: true, items: true },
    });

    await logCreate(
      session.user.id,
      'INVOICE',
      invoice.id,
      { projectId, clientId, total },
      projectId
    );

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error('创建发票失败:', error);
    return NextResponse.json({ error: '创建发票失败' }, { status: 500 });
  }
}
