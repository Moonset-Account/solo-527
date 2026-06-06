import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDesignerOrAdmin } from '@/lib/auth';
import { logUpdate, logStatusChange } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireDesignerOrAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      project: true,
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  return NextResponse.json(quote);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireDesignerOrAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { status, ...updateData } = body;

  const existingQuote = await prisma.quote.findUnique({
    where: { id: params.id },
  });

  if (!existingQuote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  const data: any = { ...updateData };

  if (status && status !== existingQuote.status) {
    data.status = status;
    if (status === 'SENT') {
      data.sentAt = new Date();
    } else if (status === 'ACCEPTED') {
      data.acceptedAt = new Date();
    }
  }

  const quote = await prisma.quote.update({
    where: { id: params.id },
    data,
    include: {
      items: true,
    },
  });

  if (status && status !== existingQuote.status) {
    await logStatusChange(
      user.id,
      'QUOTE',
      quote.id,
      existingQuote.status,
      status,
      quote.projectId
    );
  } else {
    await logUpdate(
      user.id,
      'QUOTE',
      quote.id,
      existingQuote,
      updateData,
      quote.projectId
    );
  }

  return NextResponse.json(quote);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireDesignerOrAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
  });

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  await prisma.quote.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
