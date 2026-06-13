"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { PaymentStatusBadge } from "@/components/ui/Badges";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PaymentStatus } from "@prisma/client";

export default function PaymentsPage() {
  const { page, pageSize, setPage } = usePagination(15);
  const [filters, setFilters] = useState<{
    status?: PaymentStatus;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  const { data: dashboard } = api.payment.dashboard.useQuery();
  const { data, isLoading, refetch } = api.payment.list.useQuery({
    page,
    pageSize,
    status: filters.status,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : undefined,
  });
  const { data: exportData } = api.payment.export.useQuery(
    {
      status: filters.status,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : undefined,
    },
    { enabled: false }
  );

  const monthlyChartData = useMemo(() => {
    if (!dashboard?.byMonth) return [];
    return Object.entries(dashboard.byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month: month.replace("-", "/"),
        应收: Number(values.receivable.toFixed(0)),
        实收: Number(values.received.toFixed(0)),
      }))
      .slice(-12);
  }, [dashboard?.byMonth]);

  const overdueList = useMemo(() => {
    return data?.list.filter((p) => {
      if (p.status === "PAID" || p.status === "REFUNDED") return false;
      if (!p.dueDate) return false;
      return new Date(p.dueDate) < new Date();
    });
  }, [data?.list]);

  const exportCSV = () => {
    if (!exportData) return;
    const csv = [
      exportData.headers.join(","),
      ...exportData.rows.map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportData.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="应收总额"
          value={`¥${formatMoney(dashboard?.totalReceivable ?? 0)}`}
          icon="📋"
          color="bg-slate-50 text-slate-700"
        />
        <StatCard
          title="实收总额"
          value={`¥${formatMoney(dashboard?.totalReceived ?? 0)}`}
          icon="💰"
          color="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="未收金额"
          value={`¥${formatMoney(dashboard?.outstanding ?? 0)}`}
          icon="⚠️"
          color="bg-red-50 text-red-700"
        />
        <StatCard
          title="回款率"
          value={`${((dashboard?.collectionRate ?? 0) * 100).toFixed(1)}%`}
          icon="📊"
          color="bg-primary-50 text-primary-700"
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">月度回款趋势</h3>
          <div className="text-xs text-slate-500">最近 12 个月</div>
        </div>
        <div className="card-body">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(v: number) => `¥${v.toLocaleString("zh-CN")}`}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <Legend />
                <Bar dataKey="应收" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="实收" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="card-header">
            <h3 className="font-semibold">回款列表</h3>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => refetch().then(() => exportCSV())}>
                导出 CSV
              </button>
            </div>
          </div>
          <div className="p-4 flex flex-wrap gap-3 items-end border-b border-slate-200">
            <div>
              <label className="label">状态</label>
              <select
                className="input w-36"
                value={filters.status ?? ""}
                onChange={(e) => {
                  setFilters({ ...filters, status: (e.target.value || undefined) as PaymentStatus });
                  setPage(1);
                }}
              >
                <option value="">全部</option>
                <option value="UNPAID">未付款</option>
                <option value="PARTIAL">部分付款</option>
                <option value="PAID">已付清</option>
                <option value="REFUNDED">已退款</option>
              </select>
            </div>
            <div>
              <label className="label">创建日期从</label>
              <input
                type="date"
                className="input w-40"
                value={filters.dateFrom ?? ""}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <label className="label">至</label>
              <input
                type="date"
                className="input w-40"
                value={filters.dateTo ?? ""}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
            <button
              onClick={() => {
                setFilters({});
                setPage(1);
              }}
              className="btn-secondary"
            >
              重置
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">客户</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">项目</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">应收</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">已收</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">未收</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">状态</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">到期日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">加载中…</td></tr>
              ) : !data?.list.length ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">暂无回款记录</td></tr>
              ) : (
                data.list.map((p) => {
                  const total = Number(p.totalAmount);
                  const paid = Number(p.paidAmount);
                  const unpaid = total - paid;
                  const isOverdue =
                    (p.status !== "PAID" && p.status !== "REFUNDED") &&
                    p.dueDate && new Date(p.dueDate) < new Date();
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">
                        {p.customer?.name ?? p.lead?.customer?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={p.itemName}>
                        {p.itemName}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">¥{formatMoney(total)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">¥{formatMoney(paid)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${unpaid > 0 ? "text-red-600" : "text-slate-400"}`}>
                        ¥{formatMoney(unpaid)}
                      </td>
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={p.status} />
                        {isOverdue && <span className="ml-2 text-xs text-red-600 font-medium">逾期</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {p.dueDate ? new Date(p.dueDate).toLocaleDateString("zh-CN") : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <Pagination
            total={data?.total ?? 0}
            page={page}
            pageSize={pageSize}
            onChange={setPage}
          />
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">逾期概览</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-red-50 p-4 text-center">
                  <div className="text-sm text-red-600 mb-1">逾期单数</div>
                  <div className="text-2xl font-bold text-red-700">{dashboard?.overdueCount ?? 0}</div>
                </div>
                <div className="rounded-lg bg-amber-50 p-4 text-center">
                  <div className="text-sm text-amber-600 mb-1">逾期金额</div>
                  <div className="text-2xl font-bold text-amber-700">¥{formatMoney(dashboard?.overdueAmount ?? 0)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="card-header">
              <h3 className="font-semibold">逾期明细</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!overdueList?.length ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  🎉 暂无逾期回款
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {overdueList.map((p) => {
                    const unpaid = Number(p.totalAmount) - Number(p.paidAmount);
                    const days = Math.floor(
                      (Date.now() - new Date(p.dueDate!).getTime()) / (24 * 60 * 60 * 1000)
                    );
                    return (
                      <div key={p.id} className="p-4 hover:bg-slate-50">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium text-sm truncate flex-1 mr-2">
                            {p.customer?.name ?? p.lead?.customer?.name ?? "—"}
                          </div>
                          <span className="text-xs text-red-600 font-medium whitespace-nowrap">
                            逾期 {days} 天
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-2 truncate">{p.itemName}</div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">未收</span>
                          <span className="font-medium text-red-600">¥{formatMoney(unpaid)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div className={`p-5 rounded-xl ${color} transition hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm opacity-80 mb-1">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
        <div className="text-3xl opacity-60">{icon}</div>
      </div>
    </div>
  );
}

function formatMoney(n: number) {
  return n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}
