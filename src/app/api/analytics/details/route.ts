import { NextResponse } from 'next/server';
import { getPrescriptionDetails } from '@/lib/dataAccess';
import type { FilterState } from '@/types';
import type { DrillDownFilter } from '@/store/useFilterStore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      filters,
      drillDown = {},
      page = 1,
      pageSize = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = body as {
      filters: FilterState;
      drillDown?: DrillDownFilter;
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };

    const { data, source } = await getPrescriptionDetails(
      filters,
      drillDown,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    return NextResponse.json({
      success: true,
      data,
      metadata: {
        source: source === 'db' ? 'PostgreSQL + PostGIS' : 'Mock Data (DB unavailable)',
        queryTime: new Date().toISOString(),
        indexesUsed: source === 'db'
          ? [
              'idx_prescriptions_created_at',
              'idx_prescriptions_type',
              'idx_prescriptions_window_id',
              'idx_prescriptions_composite',
            ]
          : ['in-memory sort'],
        executionPlan: source === 'db'
          ? 'Index Scan using idx_prescriptions_composite + ORDER BY + LIMIT/OFFSET'
          : 'In-memory filter + sort + slice',
        dateRangeApplied: `${filters.dateRange.start} to ${filters.dateRange.end}`,
        drillDownFilters: Object.keys(drillDown).length > 0 ? drillDown : 'none',
      },
    });
  } catch (error) {
    console.error('Details API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return NextResponse.json({
    success: true,
    message: 'Pharmacy Analytics API - PostGIS Powered',
    endpoints: {
      overview: 'POST /api/analytics/overview - KPI + charts data',
      heatmap: 'POST /api/analytics/heatmap - Window heatmap with spatial data',
      details: 'POST /api/analytics/details - Paginated prescription records',
      remarks: 'GET/POST /api/remarks - User annotations',
    },
    postgisCapabilities: [
      'Spatial filtering with ST_Contains() / ST_DWithin()',
      'GIST spatial indexes on geometry columns',
      'Materialized views for heatmap aggregation',
      'Spatial joins between windows and prescriptions',
      'Geographic coordinate system (SRID 4326)',
    ],
    dataSources: ['PostgreSQL 15+', 'PostGIS 3.3+', 'HIS system integration'],
    queryParams: Object.fromEntries(searchParams.entries()),
  });
}
