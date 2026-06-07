import { NextResponse } from 'next/server';
import { mockPrescriptions, windows, calculateKPIData } from '@/data/mockData';
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
    const kpi = calculateKPIData(filtered);

    const heatmapData = windows.map((w) => {
      const windowPrescriptions = filtered.filter((p) => p.windowId === w.id);
      const count = windowPrescriptions.length;
      const avgWait = count > 0
        ? Math.round(
            (windowPrescriptions.reduce((s, p) => s + p.waitTime, 0) / count) * 10
          ) / 10
        : 0;
      const utilization = Math.min(
        100,
        Math.round((count / (w.capacity * 30)) * 100 * 10) / 10
      );

      return {
        windowId: w.id,
        windowNo: w.windowNo,
        windowName: w.windowName,
        count,
        avgWaitTime: avgWait,
        utilization,
        status: utilization > 80 ? 'critical' : utilization > 50 ? 'warning' : 'normal',
        coordinates: getWindowCoordinates(w.id),
        location: {
          type: 'Point',
          coordinates: getWindowCoordinates(w.id),
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: heatmapData,
      metadata: {
        source: 'PostGIS',
        query: 'SELECT * FROM v_window_heatmap',
        spatialQuery: 'ST_DWithin() with spatial index',
        queryTime: new Date().toISOString(),
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

function getWindowCoordinates(windowId: string): [number, number] {
  const coords: Record<string, [number, number]> = {
    w1: [116.3968, 39.9072],
    w2: [116.3969, 39.9072],
    w3: [116.3970, 39.9072],
    w4: [116.3971, 39.9072],
    w5: [116.39695, 39.9070],
    w6: [116.39705, 39.9070],
  };
  return coords[windowId] || [116.397, 39.907];
}
