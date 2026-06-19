import { NextResponse } from 'next/server';
import { listWorkOrders, createWorkOrder, updateWorkOrderStatus } from '@/lib/repo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const vehicle_id = searchParams.get('vehicle_id') ?? undefined;
  const data = await listWorkOrders({
    search,
    searchFields: ['title', 'vehicle_plate', 'vehicle_brand', 'assignee_name'],
    filters: { status, vehicle_id },
    orderBy: { field: 'created_at', dir: 'desc' },
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const w = await createWorkOrder(body);
    return NextResponse.json({ data: w }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const { id, status } = await request.json();
  try {
    await updateWorkOrderStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
