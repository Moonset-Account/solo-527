import { NextResponse } from 'next/server';
import {
  listProductionNodes,
  createProductionNodes,
  updateProductionNode,
  bulkUpdateProductionNodes,
} from '@/lib/repo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workorder_id = searchParams.get('workorder_id') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const data = await listProductionNodes({
    filters: { workorder_id, status },
    orderBy: { field: 'sequence', dir: 'asc' },
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const items = Array.isArray(body) ? body : [body];
    const data = await createProductionNodes(items);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const { ids, id, ...patch } = await request.json();
  try {
    if (Array.isArray(ids) && ids.length) {
      await bulkUpdateProductionNodes(ids, patch);
    } else if (id) {
      await updateProductionNode(id, patch);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
