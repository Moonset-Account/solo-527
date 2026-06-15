"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { FilterBar } from "@/components/filter-bar";
import { Modal } from "@/components/modal";
import { formatDate } from "@/lib/utils";
import { complaintStatusConfig } from "@/lib/status-config";
import {
  ShieldAlert,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Send,
  Download,
} from "lucide-react";
import { ComplaintStatus } from "@prisma/client";

export default function AdminComplaintsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({
    pageSize: 20,
    mineOnly: false,
  });
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus.RESOLVED | ComplaintStatus.DISMISSED | "">("");
  const [response, setResponse] = useState("");

  const { data, isLoading, refetch } = api.complaint.list.useQuery(
    { page, ...filters },
    { keepPreviousData: true }
  );

  const processComplaint = api.complaint.updateStatus.useMutation({
    onSuccess: () => {
      setShowProcessModal(false);
      setSelectedComplaint(null);
      setNewStatus("");
      setResponse("");
      refetch();
    },
  });

  const filterConfig = [
    {
      key: "status",
      label: "状态",
      type: "select" as const,
      options: Object.entries(complaintStatusConfig).map(([value, { label }]) => ({
        label,
        value,
      })),
    },
    {
      key: "search",
      label: "搜索",
      type: "search" as const,
      placeholder: "搜索标题、描述...",
    },
    {
      key: "dateFrom",
      label: "开始日期",
      type: "date" as const,
    },
    {
      key: "dateTo",
      label: "结束日期",
      type: "date" as const,
    },
  ];

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleReset = () => {
    setFilters({ pageSize: 20, mineOnly: false });
    setPage(1);
  };

  const handleProcess = () => {
    if (!selectedComplaint || !newStatus || !response.trim()) return;
    processComplaint.mutate({
      id: selectedComplaint,
      status: newStatus,
      response,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">举报处理</h1>
            <p className="text-zinc-500 mt-1">处理用户举报</p>
          </div>
          <div className="flex gap-3">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
              待处理: {data?.items?.filter(c => c.status === "PENDING").length || 0}
            </span>
          </div>
        </div>

        <FilterBar
          filters={filterConfig}
          values={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
        />

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500">加载中...</div>
          ) : data?.items.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500">暂无举报记录</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        举报信息
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        关联记录
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        提交人
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        提交时间
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {data?.items.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              complaint.status === "PENDING" ? "bg-orange-100" : "bg-zinc-100"
                            }`}>
                              <ShieldAlert className={`h-5 w-5 ${
                                complaint.status === "PENDING" ? "text-orange-600" : "text-zinc-600"
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900">{complaint.title}</p>
                              <p className="text-xs text-zinc-500 line-clamp-1">
                                {complaint.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {complaint.repairRequest ? (
                            <Link
                              href={`/repairs/${complaint.repairRequestId}`}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              报修: {complaint.repairRequest.title}
                            </Link>
                          ) : complaint.trade ? (
                            <Link
                              href={`/trades/${complaint.tradeId}`}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              交易: {complaint.trade.title}
                            </Link>
                          ) : (
                            <span className="text-sm text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-zinc-400" />
                            <span className="text-sm text-zinc-700">
                              {complaint.submittedBy?.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={complaint.status} type="complaint" />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-500">
                            {formatDate(complaint.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {complaint.status === "PENDING" && (
                              <button
                                onClick={() => {
                                  setSelectedComplaint(complaint.id);
                                  setShowProcessModal(true);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                              >
                                <Send className="h-4 w-4" />
                                处理
                              </button>
                            )}
                            <Link
                              href={`/complaints/${complaint.id}`}
                              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                              title="查看详情"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </div>
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
                    pageSize={filters.pageSize}
                    total={data.total}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        title="处理举报"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowProcessModal(false)}
              className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleProcess}
              disabled={!newStatus || !response.trim() || processComplaint.isLoading}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                newStatus === "RESOLVED"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {processComplaint.isLoading ? "处理中..." : newStatus === "RESOLVED" ? "确认解决" : "确认驳回"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              处理结果
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewStatus("RESOLVED")}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  newStatus === "RESOLVED"
                    ? "border-green-500 bg-green-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">已解决</span>
              </button>
              <button
                type="button"
                onClick={() => setNewStatus("DISMISSED")}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  newStatus === "DISMISSED"
                    ? "border-red-500 bg-red-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">已驳回</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              回复内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="请输入对举报人的回复内容..."
              rows={4}
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
