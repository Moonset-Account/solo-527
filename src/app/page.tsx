"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Bell,
  Clock,
  ChevronRight,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { MetricCard } from "@/components/MetricCard";
import { AnomalyCard } from "@/components/AnomalyCard";
import { TrendChart } from "@/components/TrendChart";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { SkeletonCard } from "@/components/Skeleton";
import { useDashboardStore } from "@/store/useDashboardStore";
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/utils";
import type { MetricDataPoint } from "@/types";
import { getMockMetricData } from "@/services/mockData";

export default function DashboardPage() {
  const {
    metrics,
    anomalies,
    alerts,
    selectedTimeRange,
    isLoading,
    fetchDashboardData,
    setTimeRange,
  } = useDashboardStore();

  const [chartData, setChartData] = useState<MetricDataPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState("metric-1");

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const days = selectedTimeRange === "7d" ? 7 : selectedTimeRange === "30d" ? 30 : 90;
    setChartData(getMockMetricData(selectedMetric).slice(-days));
  }, [selectedMetric, selectedTimeRange]);

  const criticalAnomalies = anomalies.filter((a) => a.severity === "CRITICAL" || a.severity === "HIGH");
  const normalMetrics = metrics.filter((m) => m.status === "NORMAL");
  const warningMetrics = metrics.filter((m) => m.status === "WARNING");
  const criticalMetrics = metrics.filter((m) => m.status === "CRITICAL");

  const handleRefresh = () => {
    fetchDashboardData();
  };

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              运营驾驶舱
            </h1>
            <p className="text-muted-foreground mt-1">
              实时监控用户增长核心指标
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-card border border-card-border rounded-lg p-1">
              {(["7d", "30d", "90d"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-slate-100"
                  }`}
                >
                  {range === "7d" ? "7天" : range === "30d" ? "30天" : "90天"}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 animate-fade-in animate-stagger-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">正常指标</p>
                <p className="text-2xl font-display font-bold">{normalMetrics.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 animate-fade-in animate-stagger-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">警告指标</p>
                <p className="text-2xl font-display font-bold text-warning">{warningMetrics.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 animate-fade-in animate-stagger-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">严重指标</p>
                <p className="text-2xl font-display font-bold text-danger">{criticalMetrics.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 animate-fade-in animate-stagger-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">未处理告警</p>
                <p className="text-2xl font-display font-bold text-primary">{alerts.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">核心指标</h2>
            <Link
              href="/metrics"
              className="text-sm text-primary hover:text-primary-600 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} className="h-36" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric, index) => (
                <div
                  key={metric.id}
                  className={`animate-fade-in animate-stagger-${(index % 6) + 1}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Link href={`/metrics/${metric.id}`}>
                    <MetricCard
                      metric={metric}
                      onClick={() => setSelectedMetric(metric.id)}
                    />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {criticalAnomalies.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-danger" />
                异常监控
                <StatusBadge status="critical" size="sm">
                  {criticalAnomalies.length} 个待处理
                </StatusBadge>
              </h2>
              <Link
                href="/anomalies"
                className="text-sm text-primary hover:text-primary-600 flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criticalAnomalies.slice(0, 4).map((anomaly, index) => (
                <div
                  key={anomaly.id}
                  className={`animate-fade-in animate-stagger-${index + 1}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Link href={`/anomalies/${anomaly.id}`}>
                    <AnomalyCard anomaly={anomaly} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">趋势分析</h3>
                <p className="text-sm text-muted-foreground">
                  选择指标查看历史趋势
                </p>
              </div>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 bg-card border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {metrics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <TrendChart
              data={chartData}
              height={300}
              showGradient
              anomalies={anomalies
                .filter((a) => a.metricId === selectedMetric)
                .map((a) => ({
                  date: a.detectedAt.toISOString().split("T")[0],
                  severity: a.severity,
                }))}
            />
          </Card>

          <Card className="p-6 animate-fade-in animate-stagger-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">实时告警</h3>
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无告警
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(alert.triggeredAt)}
                          </span>
                          <StatusBadge status={alert.status.toLowerCase() as any} size="sm" />
                        </div>
                      </div>
                      <StatusBadge
                        status={alert.severity.toLowerCase() as any}
                        size="sm"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {alerts.length > 0 && (
          <Card className="p-6 border-danger/30 bg-danger/5 animate-fade-in animate-breathe">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-danger" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-danger">
                  重要通知：检测到 {alerts.length} 个未处理告警
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  其中 {alerts.filter((a) => a.severity === "CRITICAL").length} 个严重告警，
                  {alerts.filter((a) => a.severity === "HIGH").length} 个高级告警。
                  销售总监已收到通知，请尽快处理。
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <Button size="sm" variant="danger">
                    立即处理
                  </Button>
                  <Link href="/delivery">
                    <Button size="sm" variant="ghost">
                      <Calendar className="w-4 h-4 mr-2" />
                      查看交付进度
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
