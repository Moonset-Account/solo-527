"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TimeoutTrendChart } from "@/components/charts/TimeoutTrendChart";
import { trpc } from "@/lib/trpc/client";
import { useFilterStore } from "@/store/filterStore";
import { AlertTriangle, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TimeoutPage() {
  const { teamIds } = useFilterStore();
  const [days, setDays] = useState(7);

  const { data: timeoutTrend = [] } = trpc.dashboard.getTimeoutTrend.useQuery({
    days,
    teamIds: teamIds.length > 0 ? teamIds : undefined,
  });

  const avgWaitTime =
    timeoutTrend.length > 0
      ? Math.round(
          timeoutTrend.reduce((sum, t) => sum + t.avgWaitTime, 0) /
            timeoutTrend.length
        )
      : 0;

  const totalTimeout = timeoutTrend.reduce((sum, t) => sum + t.timeoutCount, 0);
  const totalSessions = timeoutTrend.reduce((sum, t) => sum + t.sessionCount, 0);
  const avgTimeoutRate = totalSessions > 0
    ? ((totalTimeout / totalSessions) * 100).toFixed(1)
    : "0";

  const alerts = timeoutTrend
    .filter((t) => t.timeoutRate > 0.1)
    .sort((a, b) => b.timeoutRate - a.timeoutRate)
    .slice(0, 5);

  return (
    <DashboardLayout title="超时趋势" subtitle="监控等待时长和超时率变化趋势">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  days === d
                    ? "bg-primary-500 text-white"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:border-primary-300"
                )}
              >
                近{d}天
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-primary-50">
                <Clock className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">平均等待时长</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {avgWaitTime}秒
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingDown className="w-3.5 h-3.5 text-success-500" />
              <span className="text-success-600">较上周下降 8.3%</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-warning-50">
                <AlertTriangle className="w-5 h-5 text-warning-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">超时率</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {avgTimeoutRate}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingDown className="w-3.5 h-3.5 text-success-500" />
              <span className="text-success-600">较上周下降 15.2%</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-danger-50">
                <AlertTriangle className="w-5 h-5 text-danger-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">超时时段预警</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {alerts.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-danger-500" />
              <span className="text-danger-600">需关注高峰时段</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 card">
            <h3 className="text-base font-semibold text-neutral-800 mb-4">超时趋势分析</h3>
            <TimeoutTrendChart data={timeoutTrend} />
          </div>
          <div className="card">
            <h3 className="text-base font-semibold text-neutral-800 mb-4">超时预警</h3>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-danger-100 bg-danger-50/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-800">
                      {alert.time}
                    </span>
                    <span className="badge-danger">
                      {(alert.timeoutRate * 100).toFixed(1)}% 超时
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    会话 {alert.sessionCount} 次，超时 {alert.timeoutCount} 次
                  </p>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-8 text-neutral-400">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无超时预警</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
