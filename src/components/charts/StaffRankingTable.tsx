"use client";

import { useState } from "react";
import {
  Trophy,
  Medal,
  Award,
  User,
  Clock,
  MessageSquare,
  Star,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import type { StaffMetrics, QualitySession } from "@/types";
import { cn, formatDuration } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

interface StaffRankingTableProps {
  data: StaffMetrics[];
}

export function StaffRankingTable({ data }: StaffRankingTableProps) {
  const [showProbation, setShowProbation] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  const { data: lowQualitySessions = [] } =
    trpc.dashboard.getLowQualitySessions.useQuery(
      { includeRestricted: true },
      { enabled: !!selectedStaff }
    );

  const formalStaff = data.filter((s) => !s.isProbation);
  const probationStaff = data.filter((s) => s.isProbation);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center text-neutral-500 font-mono">{index + 1}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success-600";
    if (score >= 75) return "text-primary-600";
    if (score >= 60) return "text-warning-600";
    return "text-danger-600";
  };

  const renderStaffRow = (staff: StaffMetrics, index: number, isProbation: boolean) => (
    <tr
      key={staff.staffId}
      className={cn(
        "border-b border-neutral-100 hover:bg-neutral-50/80 transition-colors",
        isProbation && "bg-amber-50/30"
      )}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {!isProbation && getRankIcon(index)}
          {isProbation && <span className="w-5 text-center text-neutral-400">·</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
            {staff.staffName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-800">{staff.staffName}</span>
              {isProbation && (
                <span className="badge-probation">新人保护期</span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-neutral-400" />
          <span className="font-mono text-neutral-700">{staff.sessionCount}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-neutral-400" />
          <span className="font-mono text-neutral-700">{formatDuration(staff.avgWaitTime)}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-neutral-400" />
          <span className="font-mono text-neutral-700">{(staff.transferRate * 100).toFixed(1)}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className={cn("font-mono font-medium", getScoreColor(staff.avgQualityScore))}>
            {staff.avgQualityScore.toFixed(1)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="w-24">
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                staff.avgQualityScore >= 85 ? "bg-success-500" :
                staff.avgQualityScore >= 70 ? "bg-primary-500" :
                staff.avgQualityScore >= 60 ? "bg-warning-500" : "bg-danger-500"
              )}
              style={{ width: `${staff.avgQualityScore}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => setSelectedStaff(selectedStaff === staff.staffId ? null : staff.staffId)}
          className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-primary-600 transition-colors"
        >
          {selectedStaff === staff.staffId ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </td>
    </tr>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-neutral-700">人员绩效排名</h4>
        <button
          onClick={() => setShowProbation(!showProbation)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            showProbation
              ? "bg-primary-50 text-primary-700"
              : "bg-neutral-100 text-neutral-600"
          )}
        >
          <User className="w-3.5 h-3.5" />
          {showProbation ? "隐藏新人" : "显示新人"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">排名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">人员</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">会话量</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">平均等待</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">转接率</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">质检分</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">综合表现</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {formalStaff.map((staff, idx) => renderStaffRow(staff, idx, false))}
            {showProbation && probationStaff.length > 0 && (
              <>
                <tr>
                  <td colSpan={8} className="px-4 py-2 bg-amber-50/50">
                    <span className="text-xs font-medium text-amber-700">
                      🎓 以下为新人保护期员工，不参与正式排名
                    </span>
                  </td>
                </tr>
                {probationStaff.map((staff, idx) => renderStaffRow(staff, idx, true))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {selectedStaff && (
        <div className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
          <h5 className="text-sm font-medium text-neutral-700 mb-3">质检低分详情（仅授权可见）</h5>
          <div className="space-y-2">
            {lowQualitySessions
              .filter((s) => s.staffName === data.find((d) => d.staffId === selectedStaff)?.staffName)
              .map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    session.isRestricted
                      ? "bg-red-50 border-red-200"
                      : "bg-white border-neutral-200"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-800">
                          {session.staffName}
                        </span>
                        <span className={cn(
                          "badge",
                          session.score < 60 ? "badge-danger" : "badge-warning"
                        )}>
                          {session.score}分
                        </span>
                        {session.isRestricted && (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <Lock className="w-3 h-3" />
                            授权受限
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {session.comments}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {session.tags.map((tag) => (
                        <span key={tag} className="badge-neutral text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
