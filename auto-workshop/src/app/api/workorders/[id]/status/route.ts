import { NextResponse } from 'next/server';
import { transitionWorkOrderStatus } from '@/lib/workorder-state';
import { recalculateCapacity } from '@/lib/capacity';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { toStatus, changedBy, changeReason, abnormalReason } = body;

  if (!toStatus) {
    return NextResponse.json({ error: 'toStatus is required' }, { status: 400 });
  }

  try {
    const workOrder = await transitionWorkOrderStatus(
      id,
      toStatus,
      changedBy,
      changeReason,
      abnormalReason
    );

    if (toStatus === 'ABNORMAL_CLOSED') {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      if (workOrder.technicianId) {
        await recalculateCapacity(workOrder.technicianId, periodStart, periodEnd);
      }
    }

    return NextResponse.json(workOrder);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Status transition failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
