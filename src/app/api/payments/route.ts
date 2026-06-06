import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logCreate, logStatusChange } from '@/lib/audit';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      include: {
        invoice: {
          include: {
            client: { select: { name: true } },
            project: { select: { name: true } },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error('获取收款记录失败:', error);
    return NextResponse.json({ error: '获取收款记录失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, amount, paymentDate, method, transactionId, notes } = body;

    if (!invoiceId || !amount || !paymentDate) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount,
          paymentDate: new Date(paymentDate),
          method,
          transactionId,
          notes,
        },
        include: { invoice: true },
      });

      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true },
      });

      if (!invoice) throw new Error('发票不存在');

      const totalPaid = invoice.payments.reduce(
        (sum, p) => sum + parseFloat(p.amount as any),
        parseFloat(amount as any)
      );
      const invoiceTotal = parseFloat(invoice.total as any);

      let newStatus = invoice.status;
      if (totalPaid >= invoiceTotal) {
        newStatus = 'PAID';
      } else if (totalPaid > 0) {
        newStatus = 'PARTIAL';
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: totalPaid,
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date() : undefined,
        },
      });

      if (newStatus !== invoice.status) {
        await logStatusChange(
          session.user.id,
          'INVOICE',
          invoiceId,
          invoice.status,
          newStatus,
          invoice.projectId
        );
      }

      await logCreate(
        session.user.id,
        'PAYMENT',
        payment.id,
        { invoiceId, amount },
        invoice.projectId
      );

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('记录收款失败:', error);
    return NextResponse.json({ error: '记录收款失败' }, { status: 500 });
  }
}
