import { NextResponse } from 'next/server';
import { getWindowHeatmap } from '@/lib/dataAccess';
import type { FilterState } from '@/types';
import type { DrillDownFilter } from '@/store/useFilterStore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filters, drillDown = {} } = body as {
      filters: FilterState;
      drillDown?: DrillDownFilter;
    };

    const { data, source } = await getWindowHeatmap(filters, drillDown);

    return NextResponse.json({
      success: true,
      data,
      metadata: {
        source: source === 'db' ? 'PostGIS' : 'Mock Data (DB unavailable)',
        query: source === 'db'
          ? 'SELECT w.*, ST_X(w.location), ST_Y(w.location), COUNT(p.id) FROM windows w LEFT JOIN prescriptions p USING(id) GROUP BY w.id'
          : 'In-memory aggregation',
        spatialQuery: source === 'db'
          ? 'GIST spatial index on prescriptions.geom used for ST_DWithin queries'
          : 'Coordinate lookup from mock data',
        queryTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Heatmap API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
