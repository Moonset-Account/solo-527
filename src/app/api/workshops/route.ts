import { NextResponse } from 'next/server';
import { queryWorkshops, queryWorkshopsGeoJSON } from '@/lib/postgis-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format');

  try {
    if (format === 'geojson') {
      const geojson = await queryWorkshopsGeoJSON();
      return NextResponse.json(geojson);
    }
    const workshops = await queryWorkshops();
    return NextResponse.json(workshops);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
