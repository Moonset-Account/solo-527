"use client";

import { Eye, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { ReturnRecord } from "@/lib/types";
import { useState } from "react";
import SampleSizeIndicator from "./SampleSizeIndicator";

export default function RecordsTable() {
  const { records, recordsTotal, loading, openDetail, summary } = useDashboardStore();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  if (loading.records && !records) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="font-medium text-slate-700 mb-1">暂无数据</h3>
        <p className="text-sm text-slate-500">当前筛选条件下没有匹配的退货记录</p>
      </div>
    );
  }

  const totalPages = Math.ceil(recordsTotal / pageSize);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-800">原始记录明细</h3>
          <p className="text-xs text-slate-500 mt-0.5">可追溯的退货单完整链路信息</p>
        </div>
        <SampleSizeIndicator sampleSize={recordsTotal} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left font-medium text-slate-600 text-xs uppercase tracking-wider">
                退货单号
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 text-xs uppercase tracking-wider">
                商品
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 text-xs uppercase tracking-wider">
                退货原因
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 text-xs uppercase tracking-wider">
                店铺/仓库
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 text-xs uppercase tracking-wider">
                退款周期
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 text-xs uppercase tracking-wider">
                申请时间
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 text-xs uppercase tracking-wider">
                质检
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 text-xs uppercase tracking-wider">
                标记
              </th>
              <th className="px-4 py-3 text-center font-medium text-slate-600 text-xs uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r: ReturnRecord, idx: number) => (
              <tr
                key={r.returnId}
                className={`hover:bg-primary-50/50 transition-colors ${
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                }`}
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.returnId}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{r.productName}</p>
                  <p className="text-xs text-slate-500">{r.sku}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-700">{r.reason}</p>
                  <p className="text-xs text-slate-500">{r.reasonDetail}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-700">{r.store}</p>
                  <p className="text-xs text-slate-500">{r.warehouse}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.refundCycle > 7
                      ? "bg-danger-50 text-danger-600"
                      : r.refundCycle > 3
                      ? "bg-warning-50 text-warning-600"
                      : "bg-success-50 text-success-600"
                  }`}>
                    {r.refundCycle} 天
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{r.applyTime}</td>
                <td className="px-4 py-3">
                  {r.qualityResult === "通过" ? (
                    <CheckCircle2 className="w-4 h-4 text-success-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-warning-500" />
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.isRepeatUser && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-warning-50 text-warning-600 rounded-full text-xs"
                      title="重复退货用户（已脱敏）"
                    >
                      <Users className="w-3 h-3" />
                      重复
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => openDetail(r)}
                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="查看详情"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, recordsTotal)} 条，共 {recordsTotal} 条
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600 px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
