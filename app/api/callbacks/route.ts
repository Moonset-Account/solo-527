import { NextResponse } from 'next/server';
import { listCallbacks, retryCallback, addCompensation } from '@/lib/repo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const source = searchParams.get('source') ?? undefined;
  const event_type = searchParams.get('event_type') ?? undefined;
  const dateFrom = searchParams.get('from') ?? undefined;
  const dateTo = searchParams.get('to') ?? undefined;
  const data = await listCallbacks({
    filters: { status, source, event_type },
    dateFrom,
    dateTo,
    orderBy: { field: 'created_at', dir: 'desc' },
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { action, id, payload } = await request.json();
  try {
    if (action === 'retry') {
      await retryCallback(id, payload?.success ?? true);
    } else if (action === 'compensate') {
      await addCompensation(id, payload);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
