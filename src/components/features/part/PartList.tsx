"use client";

import { trpc } from "@/trpc/react";
import {
  Package,
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const stockStatusColors: Record<string, string> = {
  NORMAL: "text-emerald-600 dark:text-emerald-400",
  LOW: "text-amber-600 dark:text-amber-400",
  OUT: "text-rose-600 dark:text-rose-400",
};

const categoryOptions = [
  { value: "", label: "全部分类" },
  { value: "发动机", label: "发动机" },
  { value: "底盘", label: "底盘" },
  { value: "电气", label: "电气" },
  { value: "外观", label: "外观" },
  { value: "油品", label: "油品" },
  { value: "耗材", label: "耗材" },
];

export function PartList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");

  const { data, isLoading } = trpc.part.list.useQuery({
    page,
    pageSize: 10,
    keyword: keyword || undefined,
    category: category || undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: "无库存", className: stockStatusColors.OUT };
    if (stock <= minStock) return { label: "库存不足", className: stockStatusColors.LOW };
    return { label: "库存正常", className: stockStatusColors.NORMAL };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">配件库存</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            共 {data?.total || 0} 种配件
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <ArrowUpDown className="w-4 h-4" />
            出入库
          </button>
          <Link
            href="/parts/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            新增配件
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索配件编码、名称..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              搜索
            </button>
          </form>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            高级筛选
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50">
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  配件信息
                </th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  分类
                </th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  库存
                </th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  单价
                </th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  周转天数
                </th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  库位
                </th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    加载中...
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>暂无配件数据</p>
                  </td>
                </tr>
              ) : (
                data?.data.map((part: any) => {
                  const stockStatus = getStockStatus(part.stock, part.minStock);
                  const isLow = part.stock <= part.minStock;
                  return (
                    <tr
                      key={part.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        isLow ? "bg-amber-50/50 dark:bg-amber-900/10" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {part.name}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">{part.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {part.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <p className={`font-mono font-bold ${stockStatus.className}`}>
                          {part.stock} {part.unit}
                        </p>
                        {isLow && (
                          <p className="text-xs text-amber-500 flex items-center justify-end gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            安全库存 {part.minStock}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-slate-900 dark:text-white font-medium">
                        ¥{part.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-slate-600 dark:text-slate-300 font-mono">
                          {part.turnoverDays || "-"} 天
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {part.location}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/parts/${part.id}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm"
                        >
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              显示 {(page - 1) * (data?.pageSize || 10) + 1} -{" "}
              {Math.min(page * (data?.pageSize || 10), data?.total || 0)} 条，共{" "}
              {data?.total || 0} 条
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
