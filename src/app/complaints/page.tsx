"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { FilterBar } from "@/components/filter-bar";
import { formatDate } from "@/lib/utils";
import { complaintStatusConfig } from "@/lib/status-config";
import { ShieldAlert, Plus, Eye, MessageSquare } from "lucide-react";
import { ComplaintStatus } from "@prisma/client";

export default function ComplaintsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({
    pageSize: 20,
    mineOnly: true,
  });

  const { data, isLoading } = api.complaint.list.useQuery(
    { page, ...filters },
    { placeholderData: keepPreviousData }
  );

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
    setFilters({ pageSize: 20, mineOnly: true });
    setPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">举报中心</h1>
            <p className="text-zinc-500 mt-1">查看和管理您的举报记录</p>
          </div>
          <Link
            href="/complaints/new"
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            提交举报
          </Link>
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
              <p className="text-zinc-500 mb-2">暂无举报记录</p>
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
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <ShieldAlert className="h-5 w-5 text-orange-600" />
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
                          <span className="text-sm text-zinc-700">
                            {complaint.submittedBy?.name}
                          </span>
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
                          <Link
                            href={`/complaints/${complaint.id}`}
                            className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg inline-block"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
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
    </AppLayout>
  );
}
