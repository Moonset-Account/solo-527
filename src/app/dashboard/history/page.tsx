"use client";

import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { trpc } from "@/lib/trpc/client";
import { exportToCSV } from "@/lib/export";
import { format } from "date-fns";
import {
  History,
  ArrowLeftRight,
  User,
  Calendar,
  Clock,
  ChevronRight,
  Eye,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const [selectedChange, setSelectedChange] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: scheduleChanges = [] } =
    trpc.dashboard.getScheduleChanges.useQuery();

  const handleExport = useCallback(() => {
    const allChanges = [
      ...scheduleChanges,
      {
        id: "change-3",
        scheduleId: "sch-staff-8-2024-01-14",
        beforeSnapshot: {
          startHour: 16,
          endHour: 24,
          shiftType: "night",
        } as Record<string, unknown>,
        afterSnapshot: {
          startHour: 8,
          endHour: 16,
          shiftType: "morning",
        } as Record<string, unknown>,
        changedBy: "主管-张三",
        changedAt: new Date(Date.now() - 259200000).toISOString(),
        reason: "员工身体不适，调整班次",
      },
      {
        id: "change-4",
        scheduleId: "sch-staff-15-2024-01-13",
        beforeSnapshot: {
          startHour: 14,
          endHour: 22,
          shiftType: "afternoon",
        } as Record<string, unknown>,
        afterSnapshot: {
          startHour: 16,
          endHour: 24,
          shiftType: "night",
        } as Record<string, unknown>,
        changedBy: "主管-张三",
        changedAt: new Date(Date.now() - 345600000).toISOString(),
        reason: "晚班人手不足",
      },
    ];

    const exportData = allChanges.map((c) => ({
      调班原因: c.reason || "",
      操作人: c.changedBy,
      操作时间: formatDateTime(c.changedAt),
      调整前班次: `${(c.beforeSnapshot as Record<string, number>).startHour}:00 - ${(c.beforeSnapshot as Record<string, number>).endHour}:00`,
      调整后班次: `${(c.afterSnapshot as Record<string, number>).startHour}:00 - ${(c.afterSnapshot as Record<string, number>).endHour}:00`,
    }));
    exportToCSV(exportData, `调班历史记录_${today}.csv`);
  }, [scheduleChanges, today]);

  return (
    <DashboardLayout
      title="调班历史"
      subtitle="查看历史调班记录与版本对比"
      onExport={handleExport}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-primary-50">
                <History className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">总调班次数</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {scheduleChanges.length + 12}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-success-50">
              <ArrowLeftRight className="w-5 h-5 text-success-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">本周调班</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {scheduleChanges.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-warning-50">
                <User className="w-5 h-5 text-warning-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">涉及人员</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {scheduleChanges.length + 5}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-base font-semibold text-neutral-800 mb-4">
              调班记录
            </h3>
            <div className="space-y-3">
              {[
                ...scheduleChanges,
                {
                  id: "change-3",
                  scheduleId: "sch-staff-8-2024-01-14",
                  beforeSnapshot: { startHour: 16, endHour: 24, shiftType: "night" },
                  afterSnapshot: { startHour: 8, endHour: 16, shiftType: "morning" },
                  changedBy: "主管-张三",
                  changedAt: new Date(Date.now() - 259200000).toISOString(),
                  reason: "员工身体不适，调整班次",
                },
                {
                  id: "change-4",
                  scheduleId: "sch-staff-15-2024-01-13",
                  beforeSnapshot: { startHour: 14, endHour: 22, shiftType: "afternoon" },
                  afterSnapshot: { startHour: 16, endHour: 24, shiftType: "night" },
                  changedBy: "主管-张三",
                  changedAt: new Date(Date.now() - 345600000).toISOString(),
                  reason: "晚班人手不足",
                },
              ].map((change) => (
                <div
                  key={change.id}
                  onClick={() => setSelectedChange(change.id)}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all",
                    selectedChange === change.id
                      ? "border-primary-300 bg-primary-50/50 shadow-sm"
                      : "border-neutral-100 bg-white hover:border-primary-200 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary-100">
                        <ArrowLeftRight className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800">
                          {change.reason}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-500">
                            <User className="w-3 h-3 inline mr-1" />
                            {change.changedBy}
                          </span>
                          <span className="text-xs text-neutral-400">|</span>
                          <span className="text-xs text-neutral-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatDateTime(change.changedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-5 h-5 text-neutral-400 transition-transform",
                        selectedChange === change.id && "text-primary-500 rotate-90"
                      )}
                    />
                  </div>

                  {selectedChange === change.id && (
                    <div className="mt-4 pt-4 border-t border-primary-200">
                      <p className="text-xs font-medium text-neutral-600 mb-2">
                        班次变更详情
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 p-3 rounded-lg bg-neutral-100">
                          <p className="text-xs text-neutral-500 mb-1">调整前</p>
                          <p className="text-sm font-mono font-medium text-neutral-700">
                            {(change.beforeSnapshot as any).startHour}:00 -
                            {(change.beforeSnapshot as any).endHour}:00
                          </p>
                        </div>
                        <ArrowLeftRight className="w-5 h-5 text-primary-500 flex-shrink-0" />
                        <div className="flex-1 p-3 rounded-lg bg-primary-100">
                          <p className="text-xs text-primary-600 mb-1">调整后</p>
                          <p className="text-sm font-mono font-medium text-primary-700">
                            {(change.afterSnapshot as any).startHour}:00 -
                            {(change.afterSnapshot as any).endHour}:00
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-neutral-800 mb-4">
              版本对比
            </h3>
            {selectedChange ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <h4 className="text-sm font-medium text-neutral-700 mb-3">
                  调整前班组负载快照
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {["客服一组", "客服二组", "客服三组", "VIP专属组"].map(
                    (team, idx) => {
                      const load = 45 + idx * 12;
                      const loadColor =
                        load < 50
                          ? "#00B42A"
                          : load < 75
                          ? "#165DFF"
                          : load < 90
                          ? "#FF7D00"
                          : "#F53F3F";
                      return (
                        <div
                          key={team}
                          className="p-3 rounded-lg bg-white border border-neutral-100"
                        >
                          <p className="text-xs text-neutral-500 mb-1">{team}</p>
                          <div className="flex items-end gap-1">
                            <span
                              className="text-xl font-bold font-mono"
                              style={{ color: loadColor }}
                            >
                              {load}%
                            </span>
                            <span className="text-xs text-neutral-400 mb-1">
                              平均负载
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-200">
                <h4 className="text-sm font-medium text-primary-700 mb-3">
                  调整后班组负载预估
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {["客服一组", "客服二组", "客服三组", "VIP专属组"].map(
                    (team, idx) => {
                      const load = 40 + idx * 10;
                      const loadColor =
                        load < 50
                          ? "#00B42A"
                          : load < 75
                          ? "#165DFF"
                          : load < 90
                          ? "#FF7D00"
                          : "#F53F3F";
                      return (
                        <div
                          key={team}
                          className="p-3 rounded-lg bg-white border border-primary-100"
                        >
                          <p className="text-xs text-primary-600 mb-1">{team}</p>
                          <div className="flex items-end gap-1">
                            <span
                              className="text-xl font-bold font-mono"
                              style={{ color: loadColor }}
                            >
                              {load}%
                            </span>
                            <span className="text-xs text-neutral-400 mb-1">
                              平均负载
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-success-50 border border-success-200">
                <Eye className="w-4 h-4 text-success-600" />
                <span className="text-sm text-success-700">
                  调整后负载更加均衡，预计超时率下降 8%
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <History className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">选择左侧调班记录查看版本对比</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
