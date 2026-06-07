"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import { TimeoutOrdersList, LowRatingList } from "@/components/RankLists";
import BuildingHeatmap from "@/components/BuildingHeatmap";
import {
  RepeatRateTrend,
  ResponseTimeDistribution,
  RepairTypeDistribution,
  MaterialsUsage,
} from "@/components/Charts";
import FilterBar from "@/components/FilterBar";
import {
  useWorkOrders,
  useMetrics,
  useBuildings,
  buildExportUrl,
} from "@/hooks/useApi";
import { FilterOptions, WorkOrder, Building } from "@/types";
import {
  RefreshCw,
  Clock,
  Star,
  AlertTriangle,
  Calendar,
  ListTodo,
  ChevronRight,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const router = useRouter();

  const { data: workOrders, loading: ordersLoading } = useWorkOrders(filters);
  const { data: metrics, loading: metricsLoading } = useMetrics(filters);
  const { data: buildingPoints, loading: buildingsLoading } = useBuildings(true);

  const loading = ordersLoading || metricsLoading || buildingsLoading;

  const timeoutOrders = useMemo(() => {
    return (workOrders || [])
      .filter(
        (o) =>
          o.responseTime !== undefined &&
          o.responseTime > 120 &&
          !o.isHoliday &&
          o.status !== "pending"
      )
      .sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0))
      .slice(0, 10);
  }, [workOrders]);

  const lowRatingOrders = useMemo(() => {
    return (workOrders || [])
      .filter((o) => o.tenantRating !== undefined && o.tenantRating <= 3)
      .sort((a, b) => (a.tenantRating || 5) - (b.tenantRating || 5))
      .slice(0, 10);
  }, [workOrders]);

  const handleOrderClick = (order: WorkOrder) => {
    router.push(`/work-orders/${order.id}`);
  };

  const handleDrillDown = (newFilters: FilterOptions) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const goToWorkOrders = (additionalFilters?: FilterOptions) => {
    const params = new URLSearchParams();
    const combined = { ...filters, ...additionalFilters };
    Object.entries(combined).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
    router.push(`/work-orders?${params.toString()}`);
  };

  const handleBuildingClick = (building: any) => {
    handleDrillDown({ buildingId: building.id });
  };

  const exportUrl = buildExportUrl(filters, "xlsx");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-slate-600">正在加载数据...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">
              维修响应看板
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              实时监控供应商表现，优化维修服务质量
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => goToWorkOrders()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors text-sm font-medium"
            >
              <ListTodo className="w-4 h-4" />
              查看全部工单
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          exportUrl={exportUrl}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => goToWorkOrders({ isRepeat: true })}
            className="cursor-pointer"
          >
            <MetricCard
              title="复修率"
              value={metrics?.repeatRate || 0}
              unit="%"
              trend={2.3}
              trendLabel="较上月"
              color="orange"
              icon={<RefreshCw className="w-6 h-6" />}
              delay={0}
            />
          </div>
          <div
            onClick={() => goToWorkOrders({ isHoliday: false })}
            className="cursor-pointer"
          >
            <MetricCard
              title="平均响应时长"
              value={metrics?.avgResponseTime || 0}
              unit="分钟"
              trend={-8.5}
              trendLabel="较上月"
              color="green"
              icon={<Clock className="w-6 h-6" />}
              delay={100}
            />
          </div>
          <div className="cursor-pointer">
            <MetricCard
              title="超时率"
              value={metrics?.timeoutRate || 0}
              unit="%"
              trend={-1.2}
              trendLabel="较上月"
              color="red"
              icon={<AlertTriangle className="w-6 h-6" />}
              delay={200}
            />
          </div>
          <div className="cursor-pointer">
            <MetricCard
              title="租户平均评分"
              value={metrics?.avgRating || 0}
              unit="分"
              trend={0.3}
              trendLabel="较上月"
              color="primary"
              icon={<Star className="w-6 h-6" />}
              delay={300}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">楼栋分布地图</h3>
                <span className="text-xs text-slate-500">点击楼栋可下钻筛选</span>
              </div>
              <BuildingHeatmap
                buildings={buildingPoints || []}
                workOrders={workOrders || []}
                height="380px"
                onBuildingClick={handleBuildingClick}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RepeatRateTrend orders={workOrders || []} title="复修率趋势" />
              <ResponseTimeDistribution orders={workOrders || []} title="响应时长分布" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RepairTypeDistribution orders={workOrders || []} title="维修类型分布" />
              <MaterialsUsage orders={workOrders || []} title="材料消耗明细" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-slate-900">节假日工单</h3>
              </div>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-purple-600">{metrics?.holidayOrders || 0}</p>
                <p className="text-sm text-slate-500 mt-1">单已单独标记，不纳入超时判定</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <p className="text-xs text-purple-700">
                  💡 提示：节假日工单已排除在绩效统计之外，避免误判供应商响应超时。确认中的工单也不会进入最终排行。
                </p>
              </div>
            </div>

            <TimeoutOrdersList orders={timeoutOrders} onOrderClick={handleOrderClick} />
            <LowRatingList orders={lowRatingOrders} onOrderClick={handleOrderClick} />
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">当前筛选条件</h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(filters).length === 0 ? (
              <span className="text-sm text-slate-500">未应用任何筛选条件，展示全部数据</span>
            ) : (
              <>
                {filters.buildingId && (
                  <span className="px-3 py-1 bg-white rounded-lg text-sm border border-slate-200">
                    楼栋: {(buildingPoints || []).find((b: any) => b.id === filters.buildingId)?.name || filters.buildingId}
                  </span>
                )}
                {filters.roomType && (
                  <span className="px-3 py-1 bg-white rounded-lg text-sm border border-slate-200">
                    房型: {filters.roomType}
                  </span>
                )}
                {filters.repairType && (
                  <span className="px-3 py-1 bg-white rounded-lg text-sm border border-slate-200">
                    维修类型: {filters.repairType}
                  </span>
                )}
                {filters.supplierId && (
                  <span className="px-3 py-1 bg-white rounded-lg text-sm border border-slate-200">
                    供应商: {filters.supplierId}
                  </span>
                )}
                {filters.month && (
                  <span className="px-3 py-1 bg-white rounded-lg text-sm border border-slate-200">
                    月份: {filters.month}
                  </span>
                )}
                {filters.isRepeat !== undefined && (
                  <span className="px-3 py-1 bg-white rounded-lg text-sm border border-slate-200">
                    {filters.isRepeat ? "仅复修工单" : "仅首次工单"}
                  </span>
                )}
                {filters.isHoliday !== undefined && (
                  <span className="px-3 py-1 bg-white rounded-lg text-sm border border-slate-200">
                    {filters.isHoliday ? "仅节假日工单" : "仅工作日工单"}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
