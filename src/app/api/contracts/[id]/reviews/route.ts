import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const svc = await getDataService();
  const reviews = await svc.getContractReviews(params.id);

  return NextResponse.json({ reviews });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const svc = await getDataService();
    const body = await request.json();

    const review = await svc.createContractReview({
      contractId: params.id,
      reviewerId: body.reviewerId || 'user-1',
      comment: body.comment,
      suggestions: body.suggestions || undefined,
      riskLevel: body.riskLevel || undefined,
      isApproved: body.isApproved ?? undefined,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '提交审阅意见失败' }, { status: 500 });
  }
}
