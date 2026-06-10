import { NextResponse } from 'next/server';
import { subscribeToPlan, cancelSubscription, BillingCycle } from '@/app/actions/subscription-actions';
import { DEFAULT_USER_ID } from '@/lib/db-adapter';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planId, billingCycle, userId, action } = body;

    if (action === 'cancel') {
      const result = await cancelSubscription(userId || DEFAULT_USER_ID, body.reason);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (!planId) {
      return NextResponse.json(
        { success: false, error: '缺少 planId 参数' },
        { status: 400 }
      );
    }

    const cycle: BillingCycle =
      billingCycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY';

    const result = await subscribeToPlan(planId, cycle, userId || DEFAULT_USER_ID);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (e) {
    console.error('[POST /api/subscribe] error:', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}
