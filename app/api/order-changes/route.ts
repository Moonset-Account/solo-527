import { NextResponse } from 'next/server';
import { listOrderChanges, createOrderChange, updateOrderChangeStatus } from '@/lib/repo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const responsible_id = searchParams.get('responsible_id') ?? undefined;
  const workorder_id = searchParams.get('workorder_id') ?? undefined;
  const data = await listOrderChanges({
    filters: { status, responsible_id, workorder_id },
    orderBy: { field: 'created_at', dir: 'desc' },
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const data = await createOrderChange(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const { id, status, close_note } = await request.json();
  try {
    await updateOrderChangeStatus(id, status, close_note);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
