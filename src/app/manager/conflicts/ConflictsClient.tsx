"use client";

import { useState } from "react";
import type { CourtConflict } from "@/lib/types";
import ConflictFormModal from "./ConflictFormModal";
import { formatDate, formatTime, getConflictStatusColor, getConflictStatusName } from "@/lib/utils";

interface Props {
  conflicts: CourtConflict[];
}

export default function ConflictsClient({ conflicts }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeConflict, setActiveConflict] = useState<CourtConflict | null>(null);

  const filteredConflicts =
    statusFilter === "all"
      ? conflicts
      : conflicts.filter((c) => c.status === statusFilter);

  const statusFilters = [
    { value: "all", label: "全部", count: conflicts.length },
    { value: "open", label: "待处理", count: conflicts.filter((c) => c.status === "open").length },
    { value: "in_progress", label: "处理中", count: conflicts.filter((c) => c.status === "in_progress").length },
    { value: "resolved", label: "已解决", count: conflicts.filter((c) => c.status === "resolved").length },
    { value: "closed", label: "已关闭", count: conflicts.filter((c) => c.status === "closed").length },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? "bg-primary-600 text-white"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {filter.label}
            <span
              className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                statusFilter === filter.value
                  ? "bg-white/20"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {filteredConflicts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            暂无冲突记录
          </h3>
          <p className="text-sm text-slate-500">
            当前筛选条件下没有冲突
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>场地</th>
                <th>冲突时间</th>
                <th>涉及预约</th>
                <th>状态</th>
                <th>已同步报表</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredConflicts.map((conflict) => (
                <tr key={conflict.id}>
                  <td>
                    <div className="font-medium text-slate-800">
                      {conflict.court?.name ?? "场地"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {conflict.court?.code}
                    </div>
                  </td>
                  <td>
                    <div className="text-slate-700">
                      {formatDate(conflict.conflict_date)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatTime(conflict.start_time)} -{" "}
                      {formatTime(conflict.end_time)}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-slate-100 text-slate-700">
                      {conflict.booking_ids.length} 个
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getConflictStatusColor(conflict.status)}`}>
                      {getConflictStatusName(conflict.status)}
                    </span>
                  </td>
                  <td>
                    {conflict.synced_to_safety_report ? (
                      <span className="badge bg-green-100 text-green-800">
                        ✓ 已同步
                      </span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-600">
                        未同步
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-primary text-sm py-1.5 px-3"
                      onClick={() => setActiveConflict(conflict)}
                    >
                      处理
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeConflict && (
        <ConflictFormModal
          conflict={activeConflict}
          onClose={() => setActiveConflict(null)}
        />
      )}
    </>
  );
}
