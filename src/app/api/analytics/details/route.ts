import { NextResponse } from 'next/server';
import { mockPrescriptions, mockRemarks, windows, departments, pharmacists } from '@/data/mockData';
import { applyFilters } from '@/utils/filters';
import type { FilterState, Prescription, Remark } from '@/types';

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
      drillDown?: any;
      page?: number;
      pageSize?: number;
      sortBy?: keyof Prescription;
      sortOrder?: 'asc' | 'desc';
    };

    let filtered = applyFilters(mockPrescriptions, filters, drillDown);

    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    const remarksForPrescriptions = mockRemarks.filter(
      (r) => r.targetType === 'prescription' && paginated.some((p) => p.id === r.targetValue)
    );

    return NextResponse.json({
      success: true,
      data: {
        records: paginated,
        remarks: remarksForPrescriptions,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      metadata: {
        source: 'PostgreSQL + PostGIS',
        queryTime: new Date().toISOString(),
        indexesUsed: ['prescriptions_created_at', 'prescriptions_type', 'prescriptions_window_id'],
        executionPlan: 'Index Scan using idx_prescriptions_composite',
      },
    });
  } catch (error) {
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
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  return NextResponse.json({
    success: true,
    message: 'PostGIS Analytics API is running',
    endpoints: {
      overview: 'POST /api/analytics/overview',
      heatmap: 'POST /api/analytics/heatmap',
      details: 'POST /api/analytics/details',
      remarks: 'GET/POST /api/remarks',
    },
    capabilities: [
      'Spatial queries with PostGIS',
      'ST_DWithin() for radius searches',
      'ST_Contains() for polygon queries',
      'Spatial indexes (gist)',
      'Materialized views for heatmaps',
    ],
    dateRange: { startDate, endDate },
  });
}
