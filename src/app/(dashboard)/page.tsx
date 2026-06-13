"use client";

import { Activity, AlertTriangle, TrendingUp, BarChart3, Database } from "lucide-react";
import { formatNumber } from "@/utils/format";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AnomalyTrendChart } from "@/components/dashboard/Charts";
import { ActiveAlertsList } from "@/components/dashboard/ActiveAlertsList";
import { MetricDefinitionDrawer } from "@/components/dashboard/MetricDefinitionDrawer";
import { useMetricStore } from "@/store/metricStore";
import { api } from "@/trpc/react";

function SkeletonCard() {
  return (
    <div className="card p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-16 bg-neutral-100 animate-pulse rounded" />
        <div className="w-8 h-8 rounded-lg bg-neutral-100 animate-pulse" />
      </div>
      <div className="h-7 w-20 bg-neutral-100 animate-pulse rounded" />
    </div>
  );
}

function SkeletonMetricCard() {
  return (
    <div className="card p-5">
      <div className="h-4 w-20 bg-neutral-100 animate-pulse rounded mb-3" />
      <div className="h-8 w-24 bg-neutral-100 animate-pulse rounded mb-3" />
      <div className="h-4 w-16 bg-neutral-100 animate-pulse rounded" />
    </div>
  );
}

export default function DashboardPage() {
  const { isCaliberDrawerOpen, selectedMetricId, openCaliberDrawer, closeCaliberDrawer } =
    useMetricStore();

  const { data: overview, isLoading: overviewLoading } = api.report.getOverview.useQuery();
  const { data: metrics, isLoading: metricsLoading } = api.metric.list.useQuery();
  const seedMutation = api.seed.seedDemo.useMutation();

  const isEmpty = !metricsLoading && metrics && metrics.length === 0;

  const overviewStats = overview
    ? [
        {
          label: "监控指标",
          value: overview.totalMetrics,
          unit: "个",
          icon: BarChart3,
          color: "text-primary-600",
          bg: "bg-primary-50",
        },
        {
          label: "活跃告警",
          value: overview.activeAlerts,
          unit: "条",
          icon: AlertTriangle,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          label: "本月异常",
          value: overview.thisMonthAnomalies,
          unit: "次",
          icon: Activity,
          color: "text-red-600",
          bg: "bg-red-50",
        },
        {
          label: "环比变化",
          value: overview.monthOverMonth,
          unit: "%",
          icon: TrendingUp,
          color: overview.monthOverMonth > 0 ? "text-red-600" : "text-emerald-600",
          bg: overview.monthOverMonth > 0 ? "bg-red-50" : "bg-emerald-50",
        },
      ]
    : [];

  return (
    <div className="pb-16 lg:pb-0 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-neutral-800">监控看板</h1>
        <p className="text-sm text-neutral-500 mt-1">实时追踪销售核心指标，智能识别异常波动</p>
      </div>

      {isEmpty ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
            <Database className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">暂无数据</h3>
          <p className="text-sm text-neutral-500 mb-6">数据库为空，点击下方按钮初始化演示数据</p>
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {seedMutation.isPending ? "初始化中..." : "初始化演示数据"}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {overviewLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : overviewStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="card p-4 lg:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs lg:text-sm font-medium text-neutral-500">{stat.label}</span>
                        <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl lg:text-2xl font-bold text-neutral-900 font-mono tracking-tight">
                          {stat.unit === "%" ? `${stat.value > 0 ? "+" : ""}${stat.value}` : formatNumber(stat.value)}
                        </span>
                        <span className="text-sm text-neutral-500">{stat.unit}</span>
                      </div>
                    </div>
                  );
                })}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {metricsLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonMetricCard key={i} />)
              : (metrics ?? []).map((metric) => (
                  <MetricCard
                    key={metric.id}
                    title={metric.name}
                    value={null}
                    unit={metric.unit}
                    onClick={() => openCaliberDrawer(metric.id)}
                  />
                ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
            <div className="lg:col-span-3">
              <AnomalyTrendChart />
            </div>
            <div className="lg:col-span-2">
              <ActiveAlertsList />
            </div>
          </div>
        </>
      )}

      <MetricDefinitionDrawer
        metricId={selectedMetricId}
        isOpen={isCaliberDrawerOpen}
        onClose={closeCaliberDrawer}
      />
    </div>
  );
}
