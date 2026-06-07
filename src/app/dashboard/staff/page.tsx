"use client";

import { useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StaffRankingTable } from "@/components/charts/StaffRankingTable";
import { trpc } from "@/lib/trpc/client";
import { useFilterStore } from "@/store/filterStore";
import { exportToCSV } from "@/lib/export";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Users, Trophy, Star, Clock, ArrowRightLeft } from "lucide-react";

export default function StaffPage() {
  const { teamIds } = useFilterStore();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: staffRanking = [] } = trpc.dashboard.getStaffRanking.useQuery({
    teamIds: teamIds.length > 0 ? teamIds : undefined,
    includeProbation: true,
  });

  const handleExport = useCallback(() => {
    const exportData = staffRanking.map((s, idx) => ({
      排名: idx + 1,
      客服姓名: s.staffName,
      是否试用期: s.isProbation ? "是" : "否",
      会话量: s.sessionCount,
      平均等待秒数: s.avgWaitTime,
      平均通话秒数: s.avgDuration,
      转接率: `${(s.transferRate * 100).toFixed(2)}%`,
      质检分: s.avgQualityScore,
      满意度: s.satisfaction,
      综合负载分: s.workloadScore,
    }));
    exportToCSV(exportData, `人员绩效排名_${today}.csv`);
  }, [staffRanking, today]);

  const formalStaff = staffRanking.filter((s) => !s.isProbation);
  const probationStaff = staffRanking.filter((s) => s.isProbation);

  const top3 = formalStaff.slice(0, 3);

  return (
    <DashboardLayout
      title="人员对比"
      subtitle="多维度对比客服人员绩效表现"
      onExport={handleExport}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-primary-50">
                <Users className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">正式员工</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {formalStaff.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-50">
                <Users className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">试用期员工</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {probationStaff.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-success-50">
                <Star className="w-5 h-5 text-success-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">平均质检分</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {formalStaff.length > 0
                    ? (
                        formalStaff.reduce((sum, s) => sum + s.avgQualityScore, 0) /
                        formalStaff.length
                      ).toFixed(1)
                    : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-warning-50">
              <Clock className="w-5 h-5 text-warning-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">平均等待时长</p>
                <p className="text-2xl font-bold font-mono text-neutral-800">
                  {formalStaff.length > 0
                    ? Math.round(
                        formalStaff.reduce((sum, s) => sum + s.avgWaitTime, 0) /
                          formalStaff.length
                      )
                    : 0}
                  <span className="text-sm font-normal text-neutral-500 ml-1">秒</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {top3.map((staff, idx) => (
            <div
              key={staff.staffId}
              className="card relative overflow-hidden"
            >
              <div
                className={cn(
                  "absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full opacity-10",
                  idx === 0
                    ? "bg-yellow-500"
                    : idx === 1
                    ? "bg-gray-400"
                    : "bg-amber-600"
                )}
              />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-bold">
                      {staff.staffName.charAt(0)}
                    </div>
                    <div
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        backgroundColor:
                          idx === 0
                            ? "#F59E0B"
                            : idx === 1
                            ? "#9CA3AF"
                            : "#D97706",
                      }}
                    >
                      {idx + 1}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-800">
                      {staff.staffName}
                    </h4>
                    <div className="flex items-center gap-1">
                      <Trophy
                        className={`w-4 h-4 ${
                          idx === 0
                            ? "text-yellow-500"
                            : idx === 1
                            ? "text-gray-400"
                            : "text-amber-600"
                        }`}
                      />
                      <span className="text-xs text-neutral-500">
                        第{idx + 1}名
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-neutral-100">
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-neutral-800">
                      {staff.avgQualityScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-neutral-500">质检分</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-neutral-800">
                      {staff.sessionCount}
                    </p>
                    <p className="text-xs text-neutral-500">会话量</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-neutral-800">
                      {(staff.transferRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-neutral-500">转接率</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <StaffRankingTable data={staffRanking} />
        </div>
      </div>
    </DashboardLayout>
  );
}
