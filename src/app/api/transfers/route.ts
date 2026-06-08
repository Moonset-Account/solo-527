import { NextResponse } from 'next/server';
import { queryTransferDistance, queryTransferRoutes, queryTransfersGeoJSON } from '@/lib/postgis-queries';
import { CrossShopTransfer } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromId = searchParams.get('from');
  const toId = searchParams.get('to');

  try {
    if (fromId && toId) {
      const result = await queryTransferDistance(fromId, toId);
      if (!result) return NextResponse.json({ error: 'Workshops not found' }, { status: 404 });
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: 'Missing from/to parameters' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transfers: CrossShopTransfer[] = body.transfers || [];
    const format = body.format || 'routes';

    if (format === 'geojson') {
      const geojson = await queryTransfersGeoJSON(transfers);
      return NextResponse.json(geojson);
    }

    const routes = await queryTransferRoutes(transfers);
    return NextResponse.json(routes);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
