import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDesignerOrAdmin } from '@/lib/auth';
import { logCreate } from '@/lib/audit';
import { generateQuoteNumber } from '@/lib/utils';

export async function GET(request: Request) {
  const user = await requireDesignerOrAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const clientId = searchParams.get('clientId');

  const quotes = await prisma.quote.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(clientId ? { clientId } : {}),
    },
    include: {
      client: true,
      project: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(quotes);
}

export async function POST(request: Request) {
  const user = await requireDesignerOrAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, clientId, items, taxRate = 6, notes, validUntil } = body;

  const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const quote = await prisma.quote.create({
    data: {
      quoteNumber: generateQuoteNumber(),
      projectId,
      clientId,
      subtotal,
      taxRate,
      taxAmount,
      total,
      status: 'DRAFT',
      notes,
      validUntil: validUntil ? new Date(validUntil) : null,
      items: {
        create: items.map((item: any, index: number) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          sortOrder: index,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  await logCreate(user.id, 'QUOTE', quote.id, {
    quoteNumber: quote.quoteNumber,
    total: quote.total,
  }, projectId);

  return NextResponse.json(quote);
}
