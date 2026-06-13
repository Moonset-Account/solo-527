"use client";

import { useState } from "react";
import type { SafetyReport, Court } from "@/lib/types";
import CreateReportModal from "./CreateReportModal";
import { formatDate, formatDateTime } from "@/lib/utils";

interface Props {
  reports: SafetyReport[];
  courts: Court[];
}

export default function SafetyReportsClient({ reports, courts }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4 text-sm text-slate-500">
          <span>
            冲突同步生成：
            <span className="font-medium text-slate-700">
              {reports.filter((r) => r.synced_from_conflict).length}
            </span>
          </span>
          <span>
            手动创建：
            <span className="font-medium text-slate-700">
              {reports.filter((r) => !r.synced_from_conflict).length}
            </span>
          </span>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + 创建手动报表
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            暂无安全报表
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            处理场地冲突后会自动生成报表，也可手动创建
          </p>
          <button
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            创建第一张报表
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>日期</th>
                <th>场地</th>
                <th>冲突数</th>
                <th>处理摘要</th>
                <th>来源</th>
                <th>提交时间</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const court = courts.find((c) => c.id === report.court_id);
                return (
                  <tr key={report.id}>
                    <td className="font-medium text-slate-800">
                      {formatDate(report.report_date)}
                    </td>
                    <td>
                      {court ? (
                        <div>
                          <div className="text-slate-700">{court.name}</div>
                          <div className="text-xs text-slate-500">
                            {court.code}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">全部场地</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-slate-100 text-slate-700">
                        {report.conflict_count}
                      </span>
                    </td>
                    <td className="max-w-xs">
                      {report.resolution_summary ? (
                        <span
                          className="text-sm text-slate-600 line-clamp-2"
                          title={report.resolution_summary}
                        >
                          {report.resolution_summary}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td>
                      {report.synced_from_conflict ? (
                        <span className="badge bg-blue-100 text-blue-800">
                          🔄 冲突同步
                        </span>
                      ) : (
                        <span className="badge bg-emerald-100 text-emerald-800">
                          ✍️ 手动创建
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-slate-500">
                      {formatDateTime(report.submitted_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateReportModal
          courts={courts}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  );
}
