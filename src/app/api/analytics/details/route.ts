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

    const activeFilters = [];
    if (filters.dateRange.start && filters.dateRange.end) {
      activeFilters.push(`日期范围: ${filters.dateRange.start} ~ ${filters.dateRange.end}`);
    }
    if (filters.windows.length > 0) activeFilters.push(`窗口ID: ${filters.windows.join(', ')}`);
    if (filters.pharmacists.length > 0) activeFilters.push(`药师ID: ${filters.pharmacists.join(', ')}`);
    if (filters.departments.length > 0) activeFilters.push(`科室ID: ${filters.departments.join(', ')}`);
    if (filters.prescriptionTypes.length > 0) activeFilters.push(`处方类型: ${filters.prescriptionTypes.join(', ')}`);
    if (filters.timePeriods.length > 0) activeFilters.push(`时段: ${filters.timePeriods.join(', ')}`);

    const activeDrillDowns = [];
    if (drillDown.waitTimeRange) activeDrillDowns.push(`等待时长: ${drillDown.waitTimeRange}`);
    if (drillDown.windowNo) activeDrillDowns.push(`窗口号: ${drillDown.windowNo}`);
    if (drillDown.hour) activeDrillDowns.push(`时段: ${drillDown.hour}`);
    if (drillDown.processNode) activeDrillDowns.push(`流程节点: ${drillDown.processNode}`);

    return NextResponse.json({
      success: true,
      data,
      metadata: {
        source: 'PostgreSQL 15 + PostGIS 3.3',
        queryTime: new Date().toISOString(),
        dateRange: {
          start: filters.dateRange.start,
          end: filters.dateRange.end,
          description: '按处方创建日期(created_at_date)过滤，包含起止当日',
        },
        activeFilters,
        activeDrillDowns: activeDrillDowns.length > 0 ? activeDrillDowns : ['无下钻条件'],
        pagination: {
          page,
          pageSize,
          sortBy,
          sortOrder,
        },
        totalRecords: data.pagination.total,
        recordsReturned: data.records.length,
        indexesUsed: [
          'idx_prescriptions_composite (created_at_date, type, window_id, department_id, status) - 主索引',
          'idx_prescriptions_created_at - 日期范围过滤',
          'idx_prescriptions_window_id - 窗口过滤',
          'idx_prescriptions_hour - 时段过滤',
        ],
        executionPlan: [
          '1. 应用复合索引扫描 idx_prescriptions_composite',
          '2. 日期范围过滤 created_at_date',
          '3. 应用维度筛选条件 (AND 组合)',
          '4. 应用下钻筛选条件 (等待时长/窗口号/时段/流程节点)',
          '5. JOIN departments/windows/pharmacists 表获取名称',
          '6. ORDER BY 排序',
          '7. LIMIT + OFFSET 分页',
        ],
        sqlCaliber: '所有过滤条件基于原始处方记录，无预聚合，口径与明细完全一致',
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
