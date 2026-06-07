"use client";

import { useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkloadHeatmap } from "@/components/charts/WorkloadHeatmap";
import { SchedulePanel } from "@/components/charts/SchedulePanel";
import { trpc } from "@/lib/trpc/client";
import { useFilterStore } from "@/store/filterStore";
import { exportToCSV } from "@/lib/export";
import { format } from "date-fns";

export default function WorkloadPage() {
  const { teamIds, dateRange } = useFilterStore();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: workload = [] } = trpc.dashboard.getTeamWorkload.useQuery({
    teamIds: teamIds.length > 0 ? teamIds : undefined,
    dateRange,
  });

  const { data: schedules = [] } = trpc.dashboard.getSchedules.useQuery({
    date: today,
    teamIds: teamIds.length > 0 ? teamIds : undefined,
  });

  const handleExport = useCallback(() => {
    const exportData = workload.map((w) => ({
      班组: w.teamName,
      时段: `${w.hour}:00`,
      负载率: `${w.workload}%`,
      会话量: w.sessionCount,
      平均等待秒数: w.avgWaitTime,
      在岗人数: w.staffOnDuty,
    }));
    exportToCSV(exportData, `班组负载数据_${today}.csv`);
  }, [workload, today]);

  return (
    <DashboardLayout
      title="班组负载"
      subtitle="实时监控各班组负载情况，支持调整排班"
      onExport={handleExport}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-4 gap-4">
          {["客服一组", "客服二组", "客服三组", "VIP专属组"].map((team, idx) => {
            const teamWorkload = workload.filter(
              (w) => w.teamName === team
            );
            const avgLoad =
              teamWorkload.length > 0
                ? Math.round(
                    teamWorkload.reduce((sum, w) => sum + w.workload, 0) /
                      teamWorkload.length
                  )
                : 0;
            const status =
              avgLoad < 50
                ? "空闲"
                : avgLoad < 75
                ? "正常"
                : avgLoad < 90
                ? "繁忙"
                : "过载";
            const statusColor =
              avgLoad < 50
                ? "text-success-600 bg-success-50"
                : avgLoad < 75
                ? "text-primary-600 bg-primary-50"
                : avgLoad < 90
                ? "text-warning-600 bg-warning-50"
                : "text-danger-600 bg-danger-50";

            return (
              <div key={team} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-neutral-700">{team}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                    {status}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold font-mono text-neutral-800">
                    {avgLoad}%
                  </span>
                  <span className="text-sm text-neutral-500 mb-1">平均负载</span>
                </div>
                <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      avgLoad < 50
                        ? "bg-success-500"
                        : avgLoad < 75
                        ? "bg-primary-500"
                        : avgLoad < 90
                        ? "bg-warning-500"
                        : "bg-danger-500"
                    }`}
                    style={{ width: `${avgLoad}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 card">
            <h3 className="text-base font-semibold text-neutral-800 mb-4">负载热力图</h3>
            <WorkloadHeatmap data={workload} />
          </div>
          <div className="card">
            <SchedulePanel schedules={schedules} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
