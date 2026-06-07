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

    const startTime = Date.now();
    const { data, source } = await getAnalyticsOverview(filters, drillDown);
    const queryDuration = Date.now() - startTime;

    const activeFilters = [];
    if (filters.dateRange.start && filters.dateRange.end) {
      activeFilters.push(`日期范围: ${filters.dateRange.start} ~ ${filters.dateRange.end}`);
    }
    if (filters.windows.length > 0) activeFilters.push(`窗口: ${filters.windows.length}个`);
    if (filters.pharmacists.length > 0) activeFilters.push(`药师: ${filters.pharmacists.length}个`);
    if (filters.departments.length > 0) activeFilters.push(`科室: ${filters.departments.length}个`);
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
        queryDurationMs: queryDuration,
        dateRange: {
          start: filters.dateRange.start,
          end: filters.dateRange.end,
          description: '按处方创建日期(created_at_date)过滤，包含起止当日',
        },
        activeFilters,
        activeDrillDowns: activeDrillDowns.length > 0 ? activeDrillDowns : ['无下钻条件'],
        totalRecordsScanned: data.totalCount,
        indexesUsed: [
          'idx_prescriptions_composite (created_at_date, type, window_id, department_id, status)',
          'idx_prescriptions_created_at (btree)',
          'idx_prescriptions_window_id (btree)',
          'idx_windows_location (gist) - 空间索引',
        ],
        executionPlan: [
          '1. 应用日期范围过滤 (created_at_date BETWEEN ...)',
          '2. 应用维度过滤 (窗口/药师/科室/类型/时段)',
          '3. 应用下钻过滤 (等待时长/窗口号/时段/流程节点)',
          '4. JOIN 窗口表获取窗口号和空间坐标',
          '5. GROUP BY 聚合计算 KPI 和图表数据',
          '6. PostGIS ST_X/ST_Y 提取窗口经纬度用于热力图',
        ],
        sankeyDataCaliber: '各环节平均耗时从原始处方记录实时计算：缴费-创建、配药-缴费、叫号-配药、取药/退药-叫号',
        dataFreshness: 'T+0 实时查询，无缓存',
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        hint: '请确认 PostgreSQL 已启动并运行 sql/setup_with_data.sql 初始化数据',
      },
      { status: 500 }
    );
  }
}
