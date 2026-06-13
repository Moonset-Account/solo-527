"use client";

import { Activity, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";
import { mockData } from "@/utils/mockData";
import { formatNumber, formatPercent } from "@/utils/format";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AnomalyTrendChart } from "@/components/dashboard/Charts";
import { ActiveAlertsList } from "@/components/dashboard/ActiveAlertsList";
import { MetricDefinitionDrawer } from "@/components/dashboard/MetricDefinitionDrawer";
import { useMetricStore } from "@/store/metricStore";

const overviewStats = [
  {
    label: "监控指标",
    value: mockData.dashboardOverview.totalMetrics,
    unit: "个",
    icon: BarChart3,
    color: "text-primary-600",
    bg: "bg-primary-50",
  },
  {
    label: "活跃告警",
    value: mockData.dashboardOverview.activeAlerts,
    unit: "条",
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "本月异常",
    value: mockData.dashboardOverview.thisMonthAnomalies,
    unit: "次",
    icon: Activity,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    label: "环比变化",
    value: mockData.dashboardOverview.monthOverMonth,
    unit: "%",
    icon: TrendingUp,
    color: mockData.dashboardOverview.monthOverMonth > 0 ? "text-red-600" : "text-emerald-600",
    bg: mockData.dashboardOverview.monthOverMonth > 0 ? "bg-red-50" : "bg-emerald-50",
  },
];

const metricCards = [
  {
    id: "1",
    title: "销售额",
    value: 523680,
    unit: "元",
    change: 5.2,
    trend: "up" as const,
    isPositive: true,
  },
  {
    id: "2",
    title: "订单量",
    value: 2134,
    unit: "单",
    change: 3.8,
    trend: "up" as const,
    isPositive: true,
  },
  {
    id: "3",
    title: "客单价",
    value: 245,
    unit: "元",
    change: -1.2,
    trend: "down" as const,
    isPositive: true,
  },
  {
    id: "4",
    title: "转化率",
    value: 3.6,
    unit: "%",
    change: -0.8,
    trend: "down" as const,
    isPositive: false,
  },
  {
    id: "5",
    title: "新用户数",
    value: 486,
    unit: "人",
    change: 12.5,
    trend: "up" as const,
    isPositive: true,
  },
  {
    id: "6",
    title: "复购率",
    value: 34.2,
    unit: "%",
    change: -2.1,
    trend: "down" as const,
    isPositive: false,
  },
];

export default function DashboardPage() {
  const { isCaliberDrawerOpen, selectedMetricId, openCaliberDrawer, closeCaliberDrawer } =
    useMetricStore();

  return (
    <div className="pb-16 lg:pb-0 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-neutral-800">监控看板</h1>
        <p className="text-sm text-neutral-500 mt-1">实时追踪销售核心指标，智能识别异常波动</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {overviewStats.map((stat) => {
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
        {metricCards.map((metric) => (
          <MetricCard
            key={metric.id}
            title={metric.title}
            value={metric.value}
            unit={metric.unit}
            change={metric.change}
            trend={metric.trend}
            isPositive={metric.isPositive}
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

      <MetricDefinitionDrawer
        metricId={selectedMetricId}
        isOpen={isCaliberDrawerOpen}
        onClose={closeCaliberDrawer}
      />
    </div>
  );
}
