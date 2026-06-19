import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { contractId: string } }
) {
  const reviews = db.contractReviews.findMany({
    where: { contractId: params.contractId },
  });

  return NextResponse.json({ reviews });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { contractId: string } }
) {
  try {
    const body = await request.json();

    const review = db.contractReviews.create({
      data: {
        contractId: params.contractId,
        reviewerId: body.reviewerId || 'user-1',
        comment: body.comment,
        suggestions: body.suggestions || null,
        riskLevel: body.riskLevel || null,
        isApproved: body.isApproved ?? null,
      },
    });

    db.operationLogs.create({
      data: {
        operationType: 'REVIEW',
        userId: 'user-1',
        contractId: params.contractId,
        description: `提交审阅意见：${body.comment.substring(0, 30)}...`,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '提交审阅意见失败' }, { status: 500 });
  }
}
