"use client";

import { trpc } from "@/trpc/react";
import {
  ClipboardList,
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Car,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "待分配", className: "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200" },
  ASSIGNED: { label: "已分配", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  IN_PROGRESS: { label: "维修中", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  QUALITY_CHECK: { label: "待质检", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  COMPLETED: { label: "已完成", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  DELAYED: { label: "已延期", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: "低", className: "bg-slate-100 text-slate-600" },
  NORMAL: { label: "普通", className: "bg-blue-100 text-blue-600" },
  HIGH: { label: "高", className: "bg-amber-100 text-amber-600" },
  URGENT: { label: "紧急", className: "bg-rose-100 text-rose-600" },
};

const statusTabs = [
  { key: "", label: "全部" },
  { key: "PENDING", label: "待分配" },
  { key: "IN_PROGRESS", label: "维修中" },
  { key: "QUALITY_CHECK", label: "待质检" },
  { key: "COMPLETED", label: "已完成" },
  { key: "DELAYED", label: "已延期" },
];

export function WorkOrderList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeStatus, setActiveStatus] = useState("");

  const { data, isLoading } = trpc.workOrder.list.useQuery({
    page,
    pageSize: 10,
    keyword: keyword || undefined,
    status: activeStatus || undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">维修工单</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            共 {data?.total || 0} 个工单
          </p>
        </div>
        <Link
          href="/workorders/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          新建工单
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleStatusChange(tab.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeStatus === tab.key
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索工单号、车牌号..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
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
                  工单号
                </th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  车辆信息
                </th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  状态
                </th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  优先级
                </th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  预计交付
                </th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">
                  金额
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
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>暂无工单数据</p>
                  </td>
                </tr>
              ) : (
                data?.data.map((order: any) => {
                  const isDelayed =
                    order.status !== "COMPLETED" &&
                    new Date(order.estimatedDelivery) < new Date();
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        isDelayed ? "bg-rose-50/50 dark:bg-rose-900/10" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-slate-900 dark:text-white font-mono">
                          {order.orderNo}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {order.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <Car className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {order.vehicle?.plateNumber}
                            </p>
                            <p className="text-xs text-slate-500">
                              {order.vehicle?.brand} {order.vehicle?.model}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusConfig[order.status]?.className
                          }`}
                        >
                          {statusConfig[order.status]?.label}
                        </span>
                        {isDelayed && order.status !== "DELAYED" && (
                          <span className="ml-2 inline-flex items-center text-xs text-rose-500">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            已逾期
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            priorityConfig[order.priority]?.className
                          }`}
                        >
                          {priorityConfig[order.priority]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p
                          className={`text-sm ${
                            isDelayed
                              ? "text-rose-500 font-medium"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {new Date(order.estimatedDelivery).toLocaleDateString("zh-CN")}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-900 dark:text-white font-medium">
                        ¥{order.totalCost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/workorders/${order.id}`}
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
