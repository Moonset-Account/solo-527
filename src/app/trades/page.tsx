"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { FilterBar } from "@/components/filter-bar";
import { formatDate, formatCurrency, truncateText } from "@/lib/utils";
import { tradeStatusConfig } from "@/lib/status-config";
import { DollarSign, Plus, Eye, User, MapPin } from "lucide-react";
import { TradeStatus } from "@prisma/client";

export default function TradesPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({
    pageSize: 20,
    mineOnly: false,
  });

  const { data, isLoading } = api.trade.list.useQuery(
    { page, ...filters },
    { keepPreviousData: true }
  );

  const { data: user } = api.user.me.useQuery();

  const filterConfig = [
    {
      key: "status",
      label: "状态",
      type: "select" as const,
      options: Object.entries(tradeStatusConfig).map(([value, { label }]) => ({
        label,
        value,
      })),
    },
    {
      key: "category",
      label: "分类",
      type: "text" as const,
      placeholder: "如：电器、家具...",
    },
    {
      key: "search",
      label: "搜索",
      type: "search" as const,
      placeholder: "搜索标题、描述...",
    },
    {
      key: "priceMin",
      label: "最低价格",
      type: "text" as const,
      placeholder: "元",
    },
    {
      key: "priceMax",
      label: "最高价格",
      type: "text" as const,
      placeholder: "元",
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">二手交易</h1>
            <p className="text-zinc-500 mt-1">浏览和发布二手商品</p>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.mineOnly}
                onChange={(e) => setFilters({ ...filters, mineOnly: e.target.checked })}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <span className="text-sm text-zinc-600">只看我的</span>
            </label>
            <Link
              href="/trades/new"
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              发布商品
            </Link>
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
              <p className="text-zinc-500 mb-2">暂无商品</p>
              <Link
                href="/trades/new"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                立即发布
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {data?.items.map((trade) => (
                  <Link
                    key={trade.id}
                    href={`/trades/${trade.id}`}
                    className="group border border-zinc-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square bg-zinc-100 flex items-center justify-center">
                      <DollarSign className="h-16 w-16 text-zinc-300" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-zinc-900 line-clamp-1 group-hover:text-green-600">
                          {trade.title}
                        </h3>
                        <StatusBadge status={trade.status} type="trade" />
                      </div>
                      <p className="text-lg font-bold text-green-600 mb-2">
                        {formatCurrency(trade.price.toNumber())}
                      </p>
                      <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
                        {truncateText(trade.description, 50)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{trade.seller?.name}</span>
                        </div>
                        <span>{formatDate(trade.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
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
