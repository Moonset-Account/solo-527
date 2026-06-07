"use client";

import { useMemo } from "react";
import { useFilterStore } from "@/store/filter-store";
import { FilterPanel } from "@/components/dashboard/filter-panel";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";
import type { FunnelFilter } from "@/lib/types";

export default function DashboardPage() {
  const { campusIds, courseIds, ageGroups, channels, dateRange } =
    useFilterStore();

  const filters: FunnelFilter = useMemo(() => {
    const result: FunnelFilter = {};
    if (campusIds.length > 0) result.campusIds = campusIds;
    if (courseIds.length > 0) result.courseIds = courseIds;
    if (ageGroups.length > 0) result.ageGroups = ageGroups;
    if (channels.length > 0) result.channels = channels;
    if (dateRange.start && dateRange.end) {
      result.dateRange = { start: dateRange.start, end: dateRange.end };
    }
    return result;
  }, [campusIds, courseIds, ageGroups, channels, dateRange]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">漏斗看板</h1>
        <p className="text-sm text-text-secondary mt-1">
          浏览→咨询→报名→候补→转正→退费全流程分析
        </p>
      </div>

      <FilterPanel />
      <MetricsCards filters={filters} />
      <FunnelChart filters={filters} />
      <TrendChart filters={filters} />
    </div>
  );
}
