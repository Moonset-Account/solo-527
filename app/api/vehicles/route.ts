import { NextResponse } from 'next/server';
import { listVehicles, createVehicle } from '@/lib/repo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q') ?? undefined;
  const brand = searchParams.get('brand') ?? undefined;
  const data = await listVehicles({
    search,
    searchFields: ['plate_number', 'brand', 'model', 'owner_name', 'vin'],
    filters: { brand },
    orderBy: { field: 'created_at', dir: 'desc' },
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const v = await createVehicle(body);
    return NextResponse.json({ data: v }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
