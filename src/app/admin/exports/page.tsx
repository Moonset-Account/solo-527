"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { formatDate, formatFileSize } from "@/lib/utils";
import { exportStatusConfig } from "@/lib/status-config";
import {
  FileText,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
} from "lucide-react";
import { ExportFormat } from "@prisma/client";

export default function AdminExportsPage() {
  const [page, setPage] = useState(1);
  const [showNewExportModal, setShowNewExportModal] = useState(false);
  const [exportType, setExportType] = useState("repairs");
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.EXCEL);
  const [exportFilters, setExportFilters] = useState({
    status: "",
    category: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  const { data, isLoading, refetch } = api.export.listTasks.useQuery(
    { page, pageSize: 20 },
    { placeholderData: keepPreviousData, refetchInterval: 5000 }
  );

  const requestExport = api.export.requestExport.useMutation({
    onSuccess: () => {
      setShowNewExportModal(false);
      refetch();
    },
  });

  const handleRequestExport = () => {
    const filters: any = {};
    if (exportFilters.status) filters.status = exportFilters.status;
    if (exportFilters.category) filters.category = exportFilters.category;
    if (exportFilters.dateFrom) filters.dateFrom = exportFilters.dateFrom;
    if (exportFilters.dateTo) filters.dateTo = exportFilters.dateTo;
    if (exportFilters.search) filters.search = exportFilters.search;

    requestExport.mutate({
      type: exportType as any,
      format: exportFormat,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "PROCESSING":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-zinc-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      repairs: "报修记录",
      complaints: "举报记录",
      refunds: "退款记录",
      trades: "交易记录",
    };
    return labels[type] || type;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">导出任务</h1>
            <p className="text-zinc-500 mt-1">管理数据导出任务</p>
          </div>
          <button
            onClick={() => setShowNewExportModal(true)}
            className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
          >
            <Play className="h-5 w-5" />
            新建导出
          </button>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500">加载中...</div>
          ) : data?.items.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500 mb-2">暂无导出任务</p>
              <button
                onClick={() => setShowNewExportModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                创建第一个导出任务
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        任务信息
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        类型
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        格式
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        记录数
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        耗时
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        创建时间
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {data?.items.map((task) => (
                      <tr key={task.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-100 rounded-lg">
                              {getStatusIcon(task.status)}
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900">
                                {task.fileName || `导出任务 #${task.id.slice(-8)}`}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {task.user?.name}
                              </p>
                              {task.errorMessage && (
                                <p className="text-xs text-red-500 mt-1">
                                  错误: {task.errorMessage}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-700">
                            {getTypeLabel(task.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-700">{task.format}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-700">
                            {task.recordCount !== null ? task.recordCount : "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={task.status} type="export" />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-500">
                            {task.startedAt && task.completedAt
                              ? `${Math.round((new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()) / 1000)}s`
                              : "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-500">
                            {formatDate(task.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {task.status === "COMPLETED" && (
                            <button
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors ml-auto"
                            >
                              <Download className="h-4 w-4" />
                              下载
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data && data.totalPages > 1 && (
                <div className="p-4 border-t border-zinc-200">
                  <Pagination
                    page={page}
                    totalPages={data.totalPages}
                    pageSize={20}
                    total={data.total}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ${showNewExportModal ? "" : "hidden"}`}>
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-zinc-200">
            <h3 className="text-lg font-semibold text-zinc-900">新建导出任务</h3>
            <button
              onClick={() => setShowNewExportModal(false)}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                数据类型
              </label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="repairs">报修记录</option>
                <option value="complaints">举报记录</option>
                <option value="refunds">退款记录</option>
                <option value="trades">交易记录</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                导出格式
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="EXCEL">Excel (.xlsx)</option>
                <option value="CSV">CSV (.csv)</option>
                <option value="PDF">PDF (.pdf)</option>
              </select>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>导出字段说明：</strong>导出内容将包含活动参与次数、活动超额标记（超过10次标记为"是"）、最近一次变更时间和内容、关联交易信息、退款金额等完整数据。
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-200 bg-zinc-50">
            <button
              onClick={() => setShowNewExportModal(false)}
              className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleRequestExport}
              disabled={requestExport.isPending}
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requestExport.isPending ? "创建中..." : "创建导出任务"}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
