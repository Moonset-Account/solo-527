import { NextResponse } from 'next/server';
import { isPostGISAvailable, query } from '@/lib/db';
import { workOrders } from '@/lib/mock-data';
import { PriorityAdjustment } from '@/lib/types';

export async function GET() {
  try {
    const allAdjustments = workOrders.flatMap((wo) =>
      wo.priorityAdjustments.map((adj) => ({
        ...adj,
        orderNo: wo.orderNo,
        customer: wo.customer,
        product: wo.product,
      }))
    );

    if (isPostGISAvailable()) {
      try {
        const result = await query(
          `SELECT pa.*, wo.order_no, wo.customer, wo.product
           FROM priority_adjustments pa
           JOIN work_orders wo ON pa.work_order_id = wo.id
           ORDER BY pa.adjusted_at DESC`
        );
        if (result.rows.length > 0) {
          return NextResponse.json(result.rows.map((r) => ({
            id: r.id,
            workOrderId: r.work_order_id,
            adjustedAt: r.adjusted_at,
            adjustedBy: r.adjusted_by,
            oldPriority: r.old_priority,
            newPriority: r.new_priority,
            reason: r.reason,
            affectedDownstreamSteps: r.affected_downstream_steps || [],
            beforeDelayRisk: r.before_delay_risk,
            afterDelayRisk: r.after_delay_risk,
            orderNo: r.order_no,
            customer: r.customer,
            product: r.product,
          })));
        }
      } catch {
        // fallback to local
      }
    }

    return NextResponse.json(allAdjustments);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: PriorityAdjustment & { orderNo?: string; customer?: string; product?: string } = await request.json();

    if (isPostGISAvailable()) {
      try {
        await query(
          `INSERT INTO priority_adjustments
           (id, work_order_id, adjusted_at, adjusted_by, old_priority, new_priority, reason, affected_downstream_steps, before_delay_risk, after_delay_risk)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            body.id,
            body.workOrderId,
            body.adjustedAt,
            body.adjustedBy,
            body.oldPriority,
            body.newPriority,
            body.reason,
            body.affectedDownstreamSteps,
            body.beforeDelayRisk,
            body.afterDelayRisk,
          ]
        );

        await query(
          `UPDATE work_orders SET priority = $1 WHERE id = $2`,
          [body.newPriority, body.workOrderId]
        );
      } catch {
        // continue even if DB write fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
