"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { FilterBar } from "@/components/filter-bar";
import { Modal } from "@/components/modal";
import { formatDate, formatCurrency } from "@/lib/utils";
import { repairStatusConfig, repairCategoryConfig } from "@/lib/status-config";
import {
  Wrench,
  Eye,
  MessageSquare,
  Image as ImageIcon,
  User,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Trash2,
} from "lucide-react";
import { RepairStatus } from "@prisma/client";

export default function AdminRepairsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({
    pageSize: 20,
    mineOnly: false,
    assignedOnly: false,
  });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<RepairStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, refetch } = api.repair.list.useQuery(
    { page, ...filters },
    { placeholderData: keepPreviousData }
  );

  const updateStatus = api.repair.updateStatus.useMutation({
    onSuccess: () => {
      setShowStatusModal(false);
      setSelectedRepair(null);
      setNewStatus("");
      setStatusNote("");
      refetch();
    },
  });

  const deleteRepair = api.repair.delete.useMutation({
    onSuccess: () => {
      setShowDeleteModal(false);
      setDeleteId(null);
      refetch();
    },
  });

  const requestExport = api.export.requestExport.useMutation();

  const filterConfig = [
    {
      key: "status",
      label: "状态",
      type: "select" as const,
      options: Object.entries(repairStatusConfig).map(([value, { label }]) => ({
        label,
        value,
      })),
    },
    {
      key: "category",
      label: "分类",
      type: "select" as const,
      options: Object.entries(repairCategoryConfig).map(([value, { label }]) => ({
        label,
        value,
      })),
    },
    {
      key: "search",
      label: "搜索",
      type: "search" as const,
      placeholder: "搜索标题、描述、报修人...",
    },
    {
      key: "dormNumber",
      label: "宿舍楼",
      type: "text" as const,
      placeholder: "如：1号楼",
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
    setFilters({ pageSize: 20, mineOnly: false, assignedOnly: false });
    setPage(1);
  };

  const handleStatusChange = () => {
    if (!selectedRepair || !newStatus) return;
    updateStatus.mutate({
      id: selectedRepair,
      status: newStatus as RepairStatus,
      note: statusNote,
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteRepair.mutate({ id: deleteId });
  };

  const handleExport = () => {
    requestExport.mutate({
      type: "repairs",
      format: "EXCEL",
      filters: filters as any,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">报修管理</h1>
            <p className="text-zinc-500 mt-1">管理所有报修记录</p>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.assignedOnly}
                onChange={(e) => setFilters({ ...filters, assignedOnly: e.target.checked })}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <span className="text-sm text-zinc-600">只看分配给我的</span>
            </label>
            <button
              onClick={handleExport}
              disabled={requestExport.isPending}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              {requestExport.isPending ? "导出中..." : "导出数据"}
            </button>
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
              <Wrench className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500">暂无报修记录</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        报修信息
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        分类
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        位置
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        报修人
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        处理人
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        费用
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
                    {data?.items.map((repair) => (
                      <tr key={repair.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-100 rounded-lg">
                              <Wrench className="h-5 w-5 text-zinc-600" />
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900">{repair.title}</p>
                              <p className="text-xs text-zinc-500">ID: {repair.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-700">
                            {repairCategoryConfig[repair.category]?.label || repair.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-700">
                            {repair.dormNumber} {repair.roomNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-zinc-400" />
                            <span className="text-sm text-zinc-700">
                              {repair.reportedBy?.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-500">
                            {repair.assignedTo?.name || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {repair.actualCost ? (
                              <span className="text-zinc-900 font-medium">
                                {formatCurrency(repair.actualCost.toNumber())}
                              </span>
                            ) : repair.estimatedCost ? (
                              <span className="text-zinc-500">
                                预估 {formatCurrency(repair.estimatedCost.toNumber())}
                              </span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={repair.status} type="repair" />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-500">
                            {formatDate(repair.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                              <ImageIcon className="h-4 w-4" />
                              {repair._count?.photos || 0}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                              <MessageSquare className="h-4 w-4" />
                              {repair._count?.comments || 0}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedRepair(repair.id);
                                setShowStatusModal(true);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                              title="更新状态"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/repairs/${repair.id}`}
                              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                              title="查看详情"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => {
                                setDeleteId(repair.id);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="更新报修状态"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleStatusChange}
              disabled={!newStatus || updateStatus.isPending}
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateStatus.isPending ? "更新中..." : "确认更新"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              新状态
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries({
                PENDING: { label: "待处理", icon: Clock },
                ASSIGNED: { label: "已分配", icon: User },
                IN_PROGRESS: { label: "处理中", icon: RefreshCw },
                COMPLETED: { label: "已完成", icon: CheckCircle2 },
                CANCELLED: { label: "已取消", icon: XCircle },
                REJECTED: { label: "已拒绝", icon: XCircle },
              }).map(([key, { label, icon: Icon }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewStatus(key as RepairStatus)}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    newStatus === key
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              备注说明（可选）
            </label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="添加状态变更的说明..."
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="确认删除"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteRepair.isPending}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteRepair.isPending ? "删除中..." : "确认删除"}
            </button>
          </>
        }
      >
        <p className="text-zinc-600">
          确定要删除这条报修记录吗？此操作不可恢复。
        </p>
      </Modal>
    </AppLayout>
  );
}
