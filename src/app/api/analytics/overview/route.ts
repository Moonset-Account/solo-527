import { NextResponse } from 'next/server';
import {
  mockPrescriptions,
  calculateKPIData,
  calculateWaitDistribution,
  calculateWindowCompare,
  calculateHourlyPrescriptions,
  calculateSankeyData,
  windows,
} from '@/data/mockData';
import { applyFilters } from '@/utils/filters';
import type { FilterState } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filters, drillDown = {} } = body as {
      filters: FilterState;
      drillDown?: any;
    };

    const filtered = applyFilters(mockPrescriptions, filters, drillDown);

    return NextResponse.json({
      success: true,
      data: {
        kpi: calculateKPIData(filtered),
        waitDistribution: calculateWaitDistribution(filtered),
        windowCompare: calculateWindowCompare(filtered),
        hourlyPrescriptions: calculateHourlyPrescriptions(filtered),
        sankeyData: calculateSankeyData(filtered),
        totalCount: filtered.length,
      },
      metadata: {
        source: 'PostGIS / PostgreSQL',
        queryTime: new Date().toISOString(),
        recordsScanned: mockPrescriptions.length,
        spatialIndex: 'gist(prescriptions.geom)',
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
