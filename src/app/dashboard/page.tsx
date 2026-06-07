"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import { TimeoutOrdersList, LowRatingList } from "@/components/RankLists";
import MapView from "@/components/MapView";
import {
  RepeatRateTrend,
  ResponseTimeBoxplot,
  RepairTypeDistribution,
  MaterialsUsage,
} from "@/components/Charts";
import FilterBar from "@/components/FilterBar";
import { MOCK_WORK_ORDERS, MOCK_BUILDINGS, getMetricsSummary } from "@/mock/data";
import { FilterOptions, WorkOrder } from "@/types";
import {
  RefreshCw,
  Clock,
  Star,
  AlertTriangle,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const router = useRouter();

  const filteredOrders = useMemo(() => {
    return MOCK_WORK_ORDERS.filter((order) => {
      if (filters.buildingId && order.buildingId !== filters.buildingId) return false;
      if (filters.roomType && order.roomType !== filters.roomType) return false;
      if (filters.repairType && order.repairType !== filters.repairType) return false;
      if (filters.supplierId && order.supplierId !== filters.supplierId) return false;
      if (filters.isRepeat !== undefined && order.isRepeat !== filters.isRepeat) return false;
      if (filters.isHoliday !== undefined && order.isHoliday !== filters.isHoliday) return false;
      return true;
    });
  }, [filters]);

  const metrics = getMetricsSummary(filteredOrders);

  const timeoutOrders = useMemo(() => {
    return filteredOrders
      .filter((o) => o.responseTime && o.responseTime > 120 && !o.isHoliday)
      .sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0))
      .slice(0, 10);
  }, [filteredOrders]);

  const lowRatingOrders = useMemo(() => {
    return filteredOrders
      .filter((o) => o.tenantRating && o.tenantRating <= 2)
      .sort((a, b) => (a.tenantRating || 0) - (b.tenantRating || 0))
      .slice(0, 10);
  }, [filteredOrders]);

  const handleOrderClick = (order: WorkOrder) => {
    router.push(`/work-orders/${order.id}`);
  };

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
          <div className="text-sm text-slate-500">
            数据更新于 {new Date().toLocaleString("zh-CN")}
          </div>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          exportData={filteredOrders}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="复修率"
            value={metrics.repeatRate}
            unit="%"
            trend={2.3}
            trendLabel="较上月"
            color="orange"
            icon={<RefreshCw className="w-6 h-6" />}
            delay={0}
          />
          <MetricCard
            title="平均响应时长"
            value={metrics.avgResponseTime}
            unit="分钟"
            trend={-8.5}
            trendLabel="较上月"
            color="green"
            icon={<Clock className="w-6 h-6" />}
            delay={100}
          />
          <MetricCard
            title="超时率"
            value={metrics.timeoutRate}
            unit="%"
            trend={-1.2}
            trendLabel="较上月"
            color="red"
            icon={<AlertTriangle className="w-6 h-6" />}
            delay={200}
          />
          <MetricCard
            title="租户平均评分"
            value={metrics.avgRating}
            unit="分"
            trend={0.3}
            trendLabel="较上月"
            color="primary"
            icon={<Star className="w-6 h-6" />}
            delay={300}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <MapView
              buildings={MOCK_BUILDINGS}
              workOrders={filteredOrders}
              height="380px"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RepeatRateTrend orders={filteredOrders} title="复修率趋势" />
              <ResponseTimeBoxplot orders={filteredOrders} title="响应时长分布" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RepairTypeDistribution orders={filteredOrders} title="维修类型分布" />
              <MaterialsUsage orders={filteredOrders} title="材料消耗明细" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-slate-900">节假日工单</h3>
              </div>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-purple-600">{metrics.holidayOrders}</p>
                <p className="text-sm text-slate-500 mt-1">单已单独标记，不纳入超时判定</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <p className="text-xs text-purple-700">
                  💡 提示：节假日工单已排除在绩效统计之外，避免误判供应商响应超时。
                </p>
              </div>
            </div>

            <TimeoutOrdersList orders={timeoutOrders} onOrderClick={handleOrderClick} />
            <LowRatingList orders={lowRatingOrders} onOrderClick={handleOrderClick} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
