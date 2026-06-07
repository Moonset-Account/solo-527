"use client";

import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import { MOCK_WORK_ORDERS, MOCK_SUPPLIERS, getMetricsSummary } from "@/mock/data";
import {
  RepeatRateTrend,
  ResponseTimeDistribution,
  MaterialsUsage,
} from "@/components/Charts";
import { RefreshCw, Clock, Star, AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";
import WorkOrderTable from "@/components/WorkOrderTable";

interface PageProps {
  params: {
    id: string;
  };
}

export default function SupplierDetailPage({ params }: PageProps) {
  const supplier = useMemo(() => {
    return MOCK_SUPPLIERS.find((s) => s.id === params.id);
  }, [params.id]);

  const supplierOrders = useMemo(() => {
    return MOCK_WORK_ORDERS.filter((o) => o.supplierId === params.id);
  }, [params.id]);

  const metrics = useMemo(() => {
    return getMetricsSummary(supplierOrders);
  }, [supplierOrders]);

  if (!supplier) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← 返回列表
          </button>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">
                {supplier.name}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                联系人: {supplier.contact} · {supplier.phone}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="复修率"
            value={metrics.repeatRate}
            unit="%"
            color="orange"
            icon={<RefreshCw className="w-6 h-6" />}
          />
          <MetricCard
            title="平均响应时长"
            value={metrics.avgResponseTime}
            unit="分钟"
            color="green"
            icon={<Clock className="w-6 h-6" />}
          />
          <MetricCard
            title="超时单数"
            value={supplier.timeoutCount}
            unit="单"
            color="red"
            icon={<AlertTriangle className="w-6 h-6" />}
          />
          <MetricCard
            title="平均评分"
            value={metrics.avgRating}
            unit="分"
            color="primary"
            icon={<Star className="w-6 h-6" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RepeatRateTrend orders={supplierOrders} title="复修率趋势" />
          <ResponseTimeDistribution orders={supplierOrders} title="响应时长分布" />
          <MaterialsUsage orders={supplierOrders} title="材料消耗" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">历史工单</h2>
          <WorkOrderTable orders={supplierOrders} />
        </div>
      </div>
    </DashboardLayout>
  );
}
