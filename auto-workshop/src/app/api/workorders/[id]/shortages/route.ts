import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handlePartShortage, markPartShortage } from '@/lib/part-shortage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const shortages = await prisma.partShortage.findMany({
    where: { workOrderId: id },
    include: { workOrderPart: { include: { part: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(shortages);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { shortageId, handledBy, handleResult, workOrderPartId, markedBy, remark, action } = body;

  if (action === 'mark') {
    if (!workOrderPartId || !markedBy) {
      return NextResponse.json(
        { error: 'workOrderPartId and markedBy are required for marking shortage' },
        { status: 400 }
      );
    }
    try {
      const result = await markPartShortage(workOrderPartId, id, markedBy, remark);
      return NextResponse.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to mark shortage';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (!shortageId || !handledBy || !handleResult) {
    return NextResponse.json(
      { error: 'shortageId, handledBy, and handleResult are required' },
      { status: 400 }
    );
  }

  try {
    const result = await handlePartShortage(shortageId, handledBy, handleResult);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to handle shortage';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
