"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { FilterBar } from "@/components/filter-bar";
import { formatDate, formatCurrency } from "@/lib/utils";
import { refundStatusConfig } from "@/lib/status-config";
import { DollarSign, Eye } from "lucide-react";
import { RefundStatus } from "@prisma/client";

export default function RefundsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({
    pageSize: 20,
    mineOnly: true,
  });

  const { data, isLoading } = api.refund.list.useQuery(
    { page, ...filters },
    { placeholderData: keepPreviousData }
  );

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
    setFilters({ pageSize: 20, mineOnly: true });
    setPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">退款管理</h1>
            <p className="text-zinc-500 mt-1">查看和管理退款申请</p>
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
                        处理人
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
                            <div className="p-2 bg-red-100 rounded-lg">
                              <DollarSign className="h-5 w-5 text-red-600" />
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
                          <span className="text-sm text-zinc-700">
                            {refund.requestedBy?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-500">
                            {refund.processedBy?.name || "-"}
                          </span>
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
                          <Link
                            href={`/refunds/${refund.id}`}
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
