import { json, useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import type { Quote, PurchaseRequest, ApiResponse } from "@app/shared";
import { api, formatMoney } from "~/lib/api";

export const loader = async ({ request }) => {
  const prs = await api.get<PurchaseRequest[]>("/api/purchase-requests", {
    status: "quoting",
    pageSize: 20,
  });

  let comparisonData: any = null;
  const url = new URL(request.url);
  const prId = url.searchParams.get("prId");

  if (prId) {
    comparisonData = await api.get(`/api/quotes/compare/${prId}`);
  }

  return json({ prs, comparisonData, selectedPrId: prId });
};

export default function ComparisonCenter() {
  const { prs, comparisonData, selectedPrId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const prList = (prs.data || []) as PurchaseRequest[];

  const handlePrChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    navigate(`/admin/comparison${id ? `?prId=${id}` : ""}`);
  };

  const currentPR = prList.find(p => p.id === selectedPrId);
  const quotes = comparisonData?.data?.quotes as Quote[] || [];
  const comparison = comparisonData?.data?.comparison || [];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">比价中心</h1>
            <p className="mt-2 text-blue-100 text-lg">
              多供应商报价横向对比，自动计算价格区间与推荐方案
            </p>
            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3">
                <div className="text-blue-200 text-xs">活跃询价单</div>
                <div className="text-2xl font-bold mt-0.5">{prList.length}</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3">
                <div className="text-blue-200 text-xs">累计报价数</div>
                <div className="text-2xl font-bold mt-0.5">
                  {prList.reduce((s, p) => s + (p.currentQuoteCount || 0), 0)}
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3">
                <div className="text-blue-200 text-xs">平均报价差异</div>
                <div className="text-2xl font-bold mt-0.5">18.6%</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 text-slate-800 shadow-2xl min-w-[320px]">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              选择采购需求进行比价
            </label>
            <select
              value={selectedPrId || ""}
              onChange={handlePrChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 font-medium"
            >
              <option value="">-- 请选择采购需求 --</option>
              {prList.map(pr => (
                <option key={pr.id} value={pr.id}>
                  {pr.code} | {pr.projectName} ({pr.currentQuoteCount}份报价)
                </option>
              ))}
            </select>
            {currentPR && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">项目编号</span>
                  <span className="font-mono font-medium">{currentPR.projectCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">材料品类</span>
                  <span className="font-medium">{currentPR.items.length} 项</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">需求日期</span>
                  <span className="font-medium">
                    {new Date(currentPR.requiredDate).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPrId && quotes.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">📊 总报价横向对比</h2>
              <p className="text-sm text-slate-500 mt-1">各供应商报价总额对比（升序排列）</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {quotes
                  .slice()
                  .sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0))
                  .map((quote, idx) => {
                    const minAmount = quotes[0].totalAmount || 0;
                    const maxAmount = quotes[quotes.length - 1].totalAmount || 1;
                    const barWidth = minAmount === maxAmount
                      ? 100
                      : ((quote.totalAmount || 0) / maxAmount) * 100;
                    const isLowest = idx === 0;
                    const diffFromMin = (quote.totalAmount || 0) - minAmount;
                    return (
                      <div key={quote.id} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {isLowest && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md">
                                🏆 最优
                              </span>
                            )}
                            <span className="font-semibold text-slate-800">{quote.supplierName}</span>
                            <span className="text-xs text-slate-400 font-mono">{quote.code}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-xl font-bold ${isLowest ? "text-emerald-600" : "text-slate-700"}`}>
                              {formatMoney(quote.totalAmount || 0)}
                            </span>
                            {!isLowest && diffFromMin > 0 && (
                              <span className="ml-3 text-xs text-orange-600 font-medium">
                                +{formatMoney(diffFromMin)} ({((diffFromMin / minAmount) * 100).toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLowest
                                ? "bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500"
                                : "bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"
                            }`}
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">🔍 逐项材料比价</h2>
              <p className="text-sm text-slate-500 mt-1">每项材料的最低价、最高价、平均价对比</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">材料名称</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">规格</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">最低价</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">均价</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">最高价</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">价格区间</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">供应商报价详情</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparison.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-5 font-medium text-slate-800">{item.materialName}</td>
                      <td className="px-6 py-5 text-sm text-slate-600">{item.specification}</td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                          {formatMoney(item.minPrice)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-medium text-slate-700">
                        {formatMoney(item.avgPrice)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                          {formatMoney(item.maxPrice)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-semibold text-amber-700">
                          {formatMoney(item.priceRange)}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">
                          ({item.maxPrice > 0 ? ((item.priceRange / item.minPrice) * 100).toFixed(1) : 0}%)
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {item.records.map((r: any, i: number) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                                i === 0
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              <span className="truncate max-w-[100px]">{r.supplierName}</span>
                              <span className="font-mono font-bold">{formatMoney(r.unitPrice)}</span>
                              {i === 0 && "✓"}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">📋 供应商报价明细</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {quotes.map(quote => (
                <div key={quote.id} className="p-6 hover:bg-slate-50/50 transition">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {quote.supplierName[0]}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-800">{quote.supplierName}</div>
                        <div className="text-xs text-slate-500 flex gap-3">
                          <span className="font-mono">{quote.code}</span>
                          <span>有效期至 {new Date(quote.validityDate).toLocaleDateString("zh-CN")}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/documents/quote/${quote.id}`)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                    >
                      查看完整报价单 →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {[
                      { label: "付款条款", value: quote.paymentTerms || "未约定" },
                      { label: "交货条款", value: quote.deliveryTerms || "未约定" },
                      { label: "质保期", value: quote.warranty || "未约定" },
                    ].map((term, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-4">
                        <div className="text-xs text-slate-500 mb-1">{term.label}</div>
                        <div className="text-sm font-medium text-slate-700">{term.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-600">
                        <tr>
                          <th className="px-4 py-2 text-left">材料</th>
                          <th className="px-4 py-2 text-right">规格</th>
                          <th className="px-4 py-2 text-center">数量</th>
                          <th className="px-4 py-2 text-right">单价</th>
                          <th className="px-4 py-2 text-right">小计</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {quote.items.slice(0, 4).map((item, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 text-slate-700">{item.name}</td>
                            <td className="px-4 py-2 text-right text-slate-600 text-xs">{item.specification}</td>
                            <td className="px-4 py-2 text-center text-slate-700">{item.quantity}{item.unit}</td>
                            <td className="px-4 py-2 text-right font-medium">{formatMoney(item.unitPrice)}</td>
                            <td className="px-4 py-2 text-right font-semibold">{formatMoney(item.subtotal)}</td>
                          </tr>
                        ))}
                        {quote.items.length > 4 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-2 text-center text-xs text-slate-500 bg-slate-50/50">
                              ...还有 {quote.items.length - 4} 项材料，点击详情查看完整清单
                            </td>
                          </tr>
                        )}
                        <tr className="bg-slate-50/80">
                          <td colSpan={4} className="px-4 py-3 text-right font-bold text-slate-700">报价合计</td>
                          <td className="px-4 py-3 text-right text-lg font-bold text-blue-600">
                            {formatMoney(quote.totalAmount || 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedPrId && quotes.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl font-semibold text-slate-700">暂无供应商报价</p>
          <p className="text-slate-500 mt-2">请等待供应商提交报价后进行比价</p>
        </div>
      )}

      {!selectedPrId && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
          <div className="text-6xl mb-4">👆</div>
          <p className="text-xl font-semibold text-slate-700">请在上方选择采购需求</p>
          <p className="text-slate-500 mt-2">筛选后将显示该需求对应的多供应商报价对比分析</p>
        </div>
      )}
    </div>
  );
}
