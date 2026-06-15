"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { FilterBar } from "@/components/filter-bar";
import { Modal } from "@/components/modal";
import { formatDate, formatCurrency } from "@/lib/utils";
import { refundStatusConfig } from "@/lib/status-config";
import {
  DollarSign,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { RefundStatus } from "@prisma/client";

export default function AdminRefundsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({
    pageSize: 20,
    mineOnly: false,
  });
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<RefundStatus.APPROVED | RefundStatus.REJECTED | "">("");
  const [notes, setNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const { data, isLoading, refetch } = api.refund.list.useQuery(
    { page, ...filters },
    { keepPreviousData: true }
  );

  const processRefund = api.refund.process.useMutation({
    onSuccess: () => {
      setShowProcessModal(false);
      setSelectedRefund(null);
      setNewStatus("");
      setNotes("");
      setTransactionId("");
      refetch();
    },
  });

  const filterConfig = [
    {
      key: "status",
      label: "状态",
      type: "select" as const,
      options: Object.entries(refundStatusConfig).map(([value, { label }]) => ({
        label,
        value,
      })),
    },
    {
      key: "search",
      label: "搜索",
      type: "search" as const,
      placeholder: "搜索原因、报修单...",
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
    if (!selectedRefund || !newStatus) return;
    processRefund.mutate({
      id: selectedRefund,
      status: newStatus,
      notes: notes || undefined,
      transactionId: transactionId || undefined,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">退款审批</h1>
            <p className="text-zinc-500 mt-1">审批用户退款申请</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500">待审批</p>
            <p className="text-2xl font-bold text-orange-600">
              {data?.items?.filter(r => r.status === "PENDING").length || 0}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500">已完成退款总额</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(data?.totalCompletedAmount || 0)}
            </p>
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
              <DollarSign className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500">暂无退款记录</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        退款信息
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        金额
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        关联报修
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        申请人
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        申请时间
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {data?.items.map((refund) => (
                      <tr key={refund.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              refund.status === "PENDING" ? "bg-red-100" : "bg-zinc-100"
                            }`}>
                              <DollarSign className={`h-5 w-5 ${
                                refund.status === "PENDING" ? "text-red-600" : "text-zinc-600"
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900 line-clamp-1">
                                {refund.reason}
                              </p>
                              <p className="text-xs text-zinc-500">ID: {refund.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-red-600">
                            {formatCurrency(refund.amount.toNumber())}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/repairs/${refund.repairRequestId}`}
                            className="text-sm text-blue-600 hover:text-blue-700 line-clamp-1"
                          >
                            {refund.repairRequest.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-zinc-400" />
                            <span className="text-sm text-zinc-700">
                              {refund.requestedBy?.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={refund.status} type="refund" />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-500">
                            {formatDate(refund.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {refund.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedRefund(refund.id);
                                    setNewStatus("APPROVED");
                                    setShowProcessModal(true);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  批准
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRefund(refund.id);
                                    setNewStatus("REJECTED");
                                    setShowProcessModal(true);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  <XCircle className="h-4 w-4" />
                                  拒绝
                                </button>
                              </>
                            )}
                            <Link
                              href={`/refunds/${refund.id}`}
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
        title={newStatus === "APPROVED" ? "批准退款" : "拒绝退款"}
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
              disabled={processRefund.isLoading}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                newStatus === "APPROVED"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {processRefund.isLoading ? "处理中..." : newStatus === "APPROVED" ? "确认批准" : "确认拒绝"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <p className="text-sm text-red-600">退款金额</p>
            <p className="text-2xl font-bold text-red-600">
              {(() => {
                const refund = data?.items?.find(r => r.id === selectedRefund);
                return refund ? formatCurrency(refund.amount.toNumber()) : "-";
              })()}
            </p>
          </div>

          {newStatus === "APPROVED" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                交易号（可选）
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="请输入退款交易号"
                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              处理备注 {newStatus === "REJECTED" && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={newStatus === "REJECTED" ? "请说明拒绝原因..." : "添加处理备注（可选）..."}
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
