"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { Pagination } from "@/components/pagination";
import { FilterBar } from "@/components/filter-bar";
import { formatDate } from "@/lib/utils";
import { userRoleConfig } from "@/lib/status-config";
import {
  ShieldAlert,
  User,
  Plus,
  TrendingUp,
  Edit3,
  Eye,
  Wrench,
  FileText,
  DollarSign,
  History,
} from "lucide-react";
import { LogAction } from "@prisma/client";

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({
    pageSize: 20,
  });

  const { data, isLoading } = api.auditLog.list.useQuery(
    { page, ...filters },
    { keepPreviousData: true }
  );

  const actionConfig: Record<string, { label: string; color: string }> = {
    CREATE: { label: "创建", color: "text-green-600 bg-green-50" },
    UPDATE: { label: "更新", color: "text-blue-600 bg-blue-50" },
    DELETE: { label: "删除", color: "text-red-600 bg-red-50" },
    STATUS_CHANGE: { label: "状态变更", color: "text-purple-600 bg-purple-50" },
    UPLOAD: { label: "上传", color: "text-cyan-600 bg-cyan-50" },
    DOWNLOAD: { label: "下载", color: "text-indigo-600 bg-indigo-50" },
    EXPORT: { label: "导出", color: "text-orange-600 bg-orange-50" },
    APPROVE: { label: "批准", color: "text-green-600 bg-green-50" },
    REJECT: { label: "拒绝", color: "text-red-600 bg-red-50" },
    REFUND: { label: "退款", color: "text-red-600 bg-red-50" },
    NOTIFY: { label: "通知", color: "text-yellow-600 bg-yellow-50" },
  };

  const entityTypeConfig: Record<string, { label: string; icon: any }> = {
    RepairRequest: { label: "报修单", icon: Wrench },
    Complaint: { label: "举报", icon: FileText },
    Refund: { label: "退款", icon: DollarSign },
    Trade: { label: "交易", icon: TrendingUp },
    User: { label: "用户", icon: User },
    Notification: { label: "通知", icon: Bell },
    ExportTask: { label: "导出", icon: FileText },
    AuditLog: { label: "日志", icon: History },
  };

  const filterConfig = [
    {
      key: "action",
      label: "操作类型",
      type: "select" as const,
      options: Object.entries(actionConfig).map(([value, { label }]) => ({
        label,
        value,
      })),
    },
    {
      key: "entityType",
      label: "实体类型",
      type: "select" as const,
      options: Object.entries(entityTypeConfig).map(([value, { label }]) => ({
        label,
        value,
      })),
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
    setFilters({ pageSize: 20 });
    setPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">操作日志</h1>
            <p className="text-zinc-500 mt-1">查看系统所有操作记录</p>
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
              <History className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500">暂无操作日志</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        时间
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        操作人
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        操作类型
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        实体类型
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        描述
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        IP地址
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {data?.items.map((log) => {
                      const action = actionConfig[log.action] || { label: log.action, color: "text-zinc-600 bg-zinc-50" };
                      const entity = entityTypeConfig[log.entityType] || { label: log.entityType, icon: FileText };
                      const EntityIcon = entity.icon;

                      return (
                        <tr key={log.id} className="hover:bg-zinc-50">
                          <td className="px-6 py-4">
                            <span className="text-sm text-zinc-500 whitespace-nowrap">
                              {formatDate(log.createdAt)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-zinc-100 rounded-lg">
                                <User className="h-3 w-3 text-zinc-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-zinc-900">
                                  {log.user?.name}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {userRoleConfig[log.user?.role || "STUDENT"]?.label}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${action.color}`}>
                              {action.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <EntityIcon className="h-4 w-4 text-zinc-400" />
                              <span className="text-sm text-zinc-700">{entity.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-zinc-700 line-clamp-2 max-w-md">
                              {log.description || `${action.label} ${entity.label}`}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-zinc-400 font-mono">
                              {log.ipAddress || "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
    </AppLayout>
  );
}
