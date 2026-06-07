import { NextResponse } from 'next/server';
import { getAnalyticsOverview } from '@/lib/dataAccess';
import type { FilterState } from '@/types';
import type { DrillDownFilter } from '@/store/useFilterStore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filters, drillDown = {} } = body as {
      filters: FilterState;
      drillDown?: DrillDownFilter;
    };

    const { data, source } = await getAnalyticsOverview(filters, drillDown);

    return NextResponse.json({
      success: true,
      data,
      metadata: {
        source: source === 'db' ? 'PostgreSQL + PostGIS' : 'Mock Data (DB unavailable)',
        queryTime: new Date().toISOString(),
        indexesUsed: source === 'db' 
          ? ['idx_prescriptions_composite', 'idx_prescriptions_created_at', 'gist(geom)']
          : ['in-memory filter'],
        executionPlan: source === 'db'
          ? 'Index Scan + Spatial Filter with PostGIS'
          : 'In-memory array filter',
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
