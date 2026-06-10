import { json, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import type { PurchaseRequest, Quote, Supplier, ApiResponse } from "@app/shared";
import { api, formatMoney, formatDate } from "~/lib/api";

export const loader = async () => {
  const [prs, quotes, suppliers] = await Promise.all([
    api.get<PurchaseRequest[]>("/api/purchase-requests", { pageSize: 100 }),
    api.get<Quote[]>("/api/quotes", { pageSize: 100 }),
    api.get<Supplier[]>("/api/suppliers", { pageSize: 100 }),
  ]);

  return json({ prs, quotes, suppliers });
};

export default function Reports() {
  const { prs, quotes, suppliers } = useLoaderData<typeof loader>();
  const [reportType, setReportType] = useState<"overview" | "purchase" | "price" | "supplier">("overview");

  const prList = (prs.data || []) as PurchaseRequest[];
  const quoteList = (quotes.data || []) as Quote[];
  const supplierList = (suppliers.data || []) as Supplier[];

  const totalPRAmount = prList.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalQuoteAmount = quoteList.reduce((s, q) => s + (q.totalAmount || 0), 0);
  const avgQuotePerPR = prList.length > 0 ? (quoteList.length / prList.length).toFixed(1) : "0";

  const deptStats: Record<string, { count: number; amount: number }> = {};
  prList.forEach(pr => {
    const dept = pr.department || "未分类";
    if (!deptStats[dept]) deptStats[dept] = { count: 0, amount: 0 };
    deptStats[dept].count++;
    deptStats[dept].amount += pr.totalAmount || 0;
  });

  const statusStats: Record<string, number> = {};
  prList.forEach(pr => {
    statusStats[pr.status] = (statusStats[pr.status] || 0) + 1;
  });

  const supplierQuoteStats: Record<string, { name: string; count: number; total: number; avg: number }> = {};
  quoteList.forEach(q => {
    const key = q.supplierId;
    if (!supplierQuoteStats[key]) {
      supplierQuoteStats[key] = { name: q.supplierName, count: 0, total: 0, avg: 0 };
    }
    supplierQuoteStats[key].count++;
    supplierQuoteStats[key].total += q.totalAmount || 0;
  });
  Object.values(supplierQuoteStats).forEach(s => {
    s.avg = s.count > 0 ? s.total / s.count : 0;
  });

  const reportTabs = [
    { key: "overview", label: "综合概览", icon: "📊" },
    { key: "purchase", label: "采购分析", icon: "📋" },
    { key: "price", label: "价格趋势", icon: "📈" },
    { key: "supplier", label: "供应商分析", icon: "🏢" },
  ];

  const maxDeptAmount = Math.max(...Object.values(deptStats).map(d => d.amount), 1);
  const maxSupplierQuotes = Math.max(...Object.values(supplierQuoteStats).map(s => s.count), 1);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">📊 报表中心</h1>
            <p className="mt-2 text-purple-100">全流程数据可视化分析 · 智能辅助决策</p>
          </div>
          <div className="flex gap-2 text-sm">
            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur font-medium transition">
              📅 本月
            </button>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur transition">
              导出报表
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: "采购需求数", value: prList.length, suffix: "单", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "采购总金额", value: formatMoney(totalPRAmount).replace("¥", ""), suffix: "元", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "累计报价数", value: quoteList.length, suffix: `份 (均${avgQuotePerPR})`, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "合作供应商", value: supplierList.length, suffix: "家", color: "text-orange-600", bg: "bg-orange-50" },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-2xl p-6 border border-white`}>
            <div className="text-sm font-medium text-slate-600">{stat.label}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-sm text-slate-500">{stat.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-100 p-1 flex gap-1 m-2">
          {reportTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setReportType(tab.key as any)}
              className={`flex-1 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                reportType === tab.key
                  ? "bg-slate-900 text-white shadow-lg"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {reportType === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 p-6 border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-5">📋 采购单状态分布</h3>
                <div className="space-y-4">
                  {Object.entries(statusStats).map(([status, count]) => {
                    const percent = (count / prList.length) * 100;
                    const labels: Record<string, string> = {
                      draft: "草稿", submitted: "已提交", quoting: "报价中",
                      comparing: "比价中", approved: "已批准", ordered: "已下单",
                      completed: "已完成", cancelled: "已取消"
                    };
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-slate-700">{labels[status] || status}</span>
                          <span className="text-slate-500">{count} 单 · {percent.toFixed(0)}%</span>
                        </div>
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 p-6 border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-5">🏢 各部门采购金额</h3>
                <div className="space-y-4">
                  {Object.entries(deptStats).sort((a, b) => b[1].amount - a[1].amount).map(([dept, data]) => {
                    const percent = (data.amount / maxDeptAmount) * 100;
                    return (
                      <div key={dept}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-slate-700">{dept}</span>
                          <div className="text-slate-500">
                            <span className="font-bold text-emerald-700">{formatMoney(data.amount)}</span>
                            <span className="ml-2 text-xs">({data.count}单)</span>
                          </div>
                        </div>
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {reportType === "purchase" && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-5">📋 采购需求明细报表</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold text-slate-600">
                      <th className="px-5 py-3 text-left">需求编号</th>
                      <th className="px-5 py-3 text-left">项目名称</th>
                      <th className="px-5 py-3 text-left">部门</th>
                      <th className="px-5 py-3 text-center">材料数</th>
                      <th className="px-5 py-3 text-center">报价数</th>
                      <th className="px-5 py-3 text-right">预算金额</th>
                      <th className="px-5 py-3 text-left">需求日期</th>
                      <th className="px-5 py-3 text-left">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prList.map(pr => (
                      <tr key={pr.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-mono text-sm text-blue-600">{pr.code}</td>
                        <td className="px-5 py-3 text-slate-800 font-medium">{pr.projectName}</td>
                        <td className="px-5 py-3 text-sm text-slate-600">{pr.department}</td>
                        <td className="px-5 py-3 text-center text-sm">{pr.items.length}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                            {pr.currentQuoteCount}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-800">
                          {formatMoney(pr.totalAmount || 0)}
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600">{formatDate(pr.requiredDate)}</td>
                        <td className="px-5 py-3 text-sm">{pr.status}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/80 font-bold">
                    <tr>
                      <td colSpan={5} className="px-5 py-3 text-right text-slate-700">合计：</td>
                      <td className="px-5 py-3 text-right text-lg text-blue-600">{formatMoney(totalPRAmount)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {reportType === "price" && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-2">💡 价格分析概览</h3>
                <p className="text-sm text-slate-600 mb-5">
                  基于历史报价数据，系统自动分析材料价格趋势与波动情况
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: "报价总金额", value: formatMoney(totalQuoteAmount), icon: "💰", desc: "所有供应商报价累计" },
                    { label: "平均单份报价", value: formatMoney(quoteList.length > 0 ? totalQuoteAmount / quoteList.length : 0), icon: "📊", desc: "每份报价的平均金额" },
                    { label: "报价供应商数", value: Object.keys(supplierQuoteStats).length, icon: "🏢", desc: "活跃报价供应商" },
                    { label: "材料SKU数", value: quoteList.reduce((s, q) => s + q.items.length, 0), icon: "🧱", desc: "累计报价材料项" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-white">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-xs text-slate-500">{item.label}</div>
                      <div className="text-xl font-bold text-slate-800 mt-1">{item.value}</div>
                      <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-6 border border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                <h3 className="text-lg font-bold text-slate-800 mb-5">🏆 供应商报价排名</h3>
                <div className="space-y-3">
                  {Object.values(supplierQuoteStats)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10)
                    .map((s, idx) => {
                      const width = (s.count / maxSupplierQuotes) * 100;
                      return (
                        <div key={idx} className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                            idx === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white" :
                            idx === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white" :
                            idx === 2 ? "bg-gradient-to-br from-orange-300 to-orange-400 text-white" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-slate-800 truncate">{s.name}</span>
                              <span className="text-slate-500 ml-2 shrink-0">
                                {s.count} 份 · 均价 {formatMoney(s.avg)}
                              </span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-full"
                                style={{ width: `${width}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {reportType === "supplier" && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-5">🏢 供应商综合分析</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold text-slate-600">
                      <th className="px-5 py-3 text-left">供应商名称</th>
                      <th className="px-5 py-3 text-center">资质状态</th>
                      <th className="px-5 py-3 text-center">评级</th>
                      <th className="px-5 py-3 text-center">报价次数</th>
                      <th className="px-5 py-3 text-right">报价总额</th>
                      <th className="px-5 py-3 text-right">平均报价</th>
                      <th className="px-5 py-3 text-center">合作品类</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierList.map(s => {
                      const stat = supplierQuoteStats[s.id] || { count: 0, total: 0, avg: 0 };
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-800">{s.name}</div>
                            <div className="text-xs text-slate-500">{s.code} · {s.contactPerson?.name} {s.contactPerson?.phone}</div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              s.qualificationStatus === "qualified" ? "bg-green-100 text-green-700" :
                              s.qualificationStatus === "warning" ? "bg-amber-100 text-amber-700" :
                              s.qualificationStatus === "expired" ? "bg-red-100 text-red-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {s.qualificationStatus}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="text-amber-500">
                              {"★".repeat(Math.round(s.rating || 0))}
                              {"☆".repeat(5 - Math.round(s.rating || 0))}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center font-semibold text-indigo-700">{stat.count}</td>
                          <td className="px-5 py-4 text-right font-semibold">{formatMoney(stat.total)}</td>
                          <td className="px-5 py-4 text-right text-sm text-slate-600">{formatMoney(stat.avg)}</td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex flex-wrap justify-center gap-1">
                              {(s.category || []).slice(0, 3).map((c, i) => (
                                <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
