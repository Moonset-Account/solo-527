import { NextResponse } from 'next/server';
import { listQualityInspections, createQualityInspection } from '@/lib/repo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const overall_result = searchParams.get('result') ?? undefined;
  const workorder_id = searchParams.get('workorder_id') ?? undefined;
  const inspector_id = searchParams.get('inspector_id') ?? undefined;
  const data = await listQualityInspections({
    filters: { overall_result, workorder_id, inspector_id },
    orderBy: { field: 'created_at', dir: 'desc' },
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const data = await createQualityInspection(body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
