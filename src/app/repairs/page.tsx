"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { FilterBar } from "@/components/filter-bar";
import { formatDate, formatCurrency } from "@/lib/utils";
import { repairStatusConfig, repairCategoryConfig } from "@/lib/status-config";
import { Wrench, Plus, Eye, MessageSquare, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { RepairStatus, RepairCategory } from "@prisma/client";

export default function RepairsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({
    pageSize: 20,
    mineOnly: true,
  });

  const { data, isLoading } = api.repair.list.useQuery(
    { page, ...filters },
    { keepPreviousData: true }
  );

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
    setFilters({ pageSize: 20, mineOnly: true });
    setPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">报修管理</h1>
            <p className="text-zinc-500 mt-1">查看和管理您的报修记录</p>
          </div>
          <Link
            href="/repairs/new"
            className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-5 w-5" />
            提交报修
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
              <Wrench className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500 mb-2">暂无报修记录</p>
              <Link
                href="/repairs/new"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                立即提交报修
              </Link>
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
                              <p className="text-xs text-zinc-500">
                                {repair.reportedBy?.name} · {repair.reportedBy?.studentId}
                              </p>
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
                            <Link
                              href={`/repairs/${repair.id}`}
                              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
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
    </AppLayout>
  );
}
