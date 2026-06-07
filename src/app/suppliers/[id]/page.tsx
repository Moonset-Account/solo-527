"use client";

import { useMemo, useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import { useSupplierDetail } from "@/hooks/useApi";
import {
  RepeatRateTrend,
  ResponseTimeDistribution,
  MaterialsUsage,
} from "@/components/Charts";
import { RefreshCw, Clock, Star, AlertTriangle, Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import WorkOrderTable from "@/components/WorkOrderTable";

interface PageProps {
  params: {
    id: string;
  };
}

export default function SupplierDetailPage({ params }: PageProps) {
  const { data, loading, error } = useSupplierDetail(params.id);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-slate-600">正在加载供应商详情...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    notFound();
  }

  const supplier = data;
  const supplierOrders = data.workOrders || [];
  const metrics = {
    repeatRate: supplier.repeatRate || 0,
    avgResponseTime: supplier.avgResponseTime || 0,
    timeoutRate: supplier.timeoutRate || 0,
    avgRating: supplier.avgRating || 0,
    totalOrders: supplier.totalOrders || 0,
    holidayOrders: supplier.holidayOrders || 0,
  };

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
            value={supplier.timeoutCount || 0}
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
