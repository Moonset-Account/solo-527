import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workOrderId = searchParams.get('workOrderId');

  const where: Record<string, unknown> = {};
  if (workOrderId) where.workOrderId = workOrderId;

  const followUps = await prisma.followUp.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(followUps);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { workOrderId, followUpAt, contactResult, satisfaction, issue, remark } = body;

  if (!workOrderId || !followUpAt) {
    return NextResponse.json(
      { error: 'workOrderId and followUpAt are required' },
      { status: 400 }
    );
  }

  const followUp = await prisma.followUp.create({
    data: {
      workOrderId,
      followUpAt: new Date(followUpAt),
      contactResult,
      satisfaction,
      issue,
      remark,
    },
  });

  return NextResponse.json(followUp, { status: 201 });
}
