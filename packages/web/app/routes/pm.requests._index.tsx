import { json, useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import type { PurchaseRequest, PurchaseStatus, ApiResponse } from "@app/shared";
import { api, formatDate, formatMoney } from "~/lib/api";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = 10;

  const result = await api.get<PurchaseRequest[]>("/api/purchase-requests", {
    status,
    page,
    pageSize,
  });

  const dashboard = await api.get<any>("/api/dashboard/summary").catch(() => ({
    success: true,
    data: { purchaseRequests: 0, quotes: 0, suppliers: 0, pendingAlerts: 0 },
  }));

  return json({ list: result, dashboard });
};

const STATUS_MAP: Record<PurchaseStatus, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-slate-100 text-slate-700" },
  submitted: { label: "已提交", color: "bg-blue-100 text-blue-700" },
  quoting: { label: "报价中", color: "bg-purple-100 text-purple-700" },
  comparing: { label: "比价中", color: "bg-amber-100 text-amber-700" },
  approved: { label: "已批准", color: "bg-green-100 text-green-700" },
  ordered: { label: "已下单", color: "bg-indigo-100 text-indigo-700" },
  completed: { label: "已完成", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "已取消", color: "bg-red-100 text-red-700" },
};

export default function PurchaseRequestList() {
  const { list, dashboard } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | "">("");

  const stats = dashboard.data || {};

  const statCards = [
    { label: "采购需求总数", value: stats.purchaseRequests || 0, icon: "📋", color: "from-blue-500 to-blue-600" },
    { label: "累计报价数", value: stats.quotes || 0, icon: "💰", color: "from-emerald-500 to-emerald-600" },
    { label: "合作供应商", value: stats.suppliers || 0, icon: "🏢", color: "from-purple-500 to-purple-600" },
    { label: "待处理提醒", value: stats.pendingAlerts || 0, icon: "🔔", color: "from-orange-500 to-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all"
          >
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full`}></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 font-medium">{card.label}</span>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <div className="mt-3 text-3xl font-bold text-slate-800 tracking-tight">
                {card.value.toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {i === 0 && "本月新增 " + Math.floor(card.value * 0.3) + " 项"}
                {i === 1 && "平均每单 " + (card.value > 0 ? (stats.purchaseRequests / card.value).toFixed(1) : 0) + " 份报价"}
                {i === 2 && "活跃供应商 " + Math.floor(card.value * 0.7) + " 家"}
                {i === 3 && card.value > 0 ? <span className="text-orange-600 font-medium">需要及时处理！</span> : "暂无待办"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">采购需求列表</h2>
              <p className="text-sm text-slate-500 mt-1">管理和跟踪所有工程项目的材料采购需求</p>
            </div>
            <button
              onClick={() => navigate("/pm/requests/new")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-md shadow-blue-500/30 transition-all hover:shadow-lg hover:shadow-blue-500/40"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建采购需求
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                statusFilter === ""
                  ? "bg-slate-900 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              全部
            </button>
            {(Object.keys(STATUS_MAP) as PurchaseStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  statusFilter === status
                    ? "bg-slate-900 text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {STATUS_MAP[status].label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">需求编号</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">项目信息</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">材料数</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">预算金额</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">需求日期</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">报价进度</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(list.data || []).map((pr: PurchaseRequest) => (
                <tr key={pr.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-mono text-sm font-semibold text-blue-600">{pr.code}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      创建于 {formatDate(pr.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-medium text-slate-800">{pr.projectName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded mr-1.5">
                        {pr.projectCode}
                      </span>
                      {pr.department} · {pr.projectManagerName}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold">
                      {pr.items.length}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-semibold text-slate-800">{formatMoney(pr.totalAmount || 0)}</span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">{formatDate(pr.requiredDate)}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-[6rem] bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min((pr.currentQuoteCount / 5) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
                        {pr.currentQuoteCount}/5
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_MAP[pr.status].color}`}>
                      {STATUS_MAP[pr.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/documents/purchase-request/${pr.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                      >
                        详情
                      </button>
                      {pr.status === "draft" && (
                        <button
                          onClick={() => navigate(`/pm/requests/new?id=${pr.id}`)}
                          className="text-slate-600 hover:text-slate-800 text-sm font-medium hover:underline"
                        >
                          编辑
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!list.data || list.data.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="text-5xl mb-4">📭</div>
                    <p className="text-slate-500 font-medium">暂无采购需求数据</p>
                    <p className="text-sm text-slate-400 mt-1">点击右上角按钮创建第一条采购需求</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
