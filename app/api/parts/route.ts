import { NextResponse } from 'next/server';
import { listParts, createPart } from '@/lib/repo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q') ?? undefined;
  const category = searchParams.get('category') ?? undefined;
  const data = await listParts({
    search,
    searchFields: ['name', 'part_code', 'category'],
    filters: { category },
    orderBy: { field: 'created_at', dir: 'desc' },
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const p = await createPart(body);
    return NextResponse.json({ data: p }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
