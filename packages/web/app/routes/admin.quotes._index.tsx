import { json, useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import type { Quote, QuoteStatus, ApiResponse, PriceFluctuation } from "@app/shared";
import { api, formatDate, formatMoney, formatDateTime } from "~/lib/api";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const prId = url.searchParams.get("prId") || undefined;
  const status = url.searchParams.get("status") || undefined;

  const [quotesRes, fluctuationsRes] = await Promise.all([
    api.get<Quote[]>("/api/quotes", { status, purchaseRequestId: prId, pageSize: 50 }),
    api.get<PriceFluctuation[]>("/api/quotes/fluctuations", { days: 30 }),
  ]);

  return json({
    quotes: quotesRes,
    fluctuations: fluctuationsRes,
  });
};

const STATUS_MAP: Record<QuoteStatus, { label: string; color: string }> = {
  submitted: { label: "待审核", color: "bg-blue-100 text-blue-700" },
  reviewing: { label: "审核中", color: "bg-purple-100 text-purple-700" },
  selected: { label: "已选中", color: "bg-green-100 text-green-700" },
  rejected: { label: "已淘汰", color: "bg-slate-100 text-slate-600" },
};

export default function QuoteManagement() {
  const { quotes, fluctuations } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"quotes" | "fluctuations">("quotes");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "">("");

  const quoteList = (quotes.data || []) as Quote[];
  const fluctuationsList = (fluctuations.data || []) as PriceFluctuation[];

  const criticalFluc = fluctuationsList.filter(f => Math.abs(f.changePercent) >= 20).length;
  const warningFluc = fluctuationsList.filter(f => Math.abs(f.changePercent) >= 10 && Math.abs(f.changePercent) < 20).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
          <div className="text-blue-100 text-sm font-medium">本月报价总数</div>
          <div className="text-4xl font-bold mt-3 tracking-tight">{quoteList.length}</div>
          <div className="text-blue-200 text-xs mt-2">较上月 ↑ 23.5%</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
          <div className="text-emerald-100 text-sm font-medium">已选中报价</div>
          <div className="text-4xl font-bold mt-3 tracking-tight">
            {quoteList.filter(q => q.status === "selected").length}
          </div>
          <div className="text-emerald-200 text-xs mt-2">选中率 67.3%</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20">
          <div className="text-orange-100 text-sm font-medium">异常价格波动</div>
          <div className="text-4xl font-bold mt-3 tracking-tight">{criticalFluc}</div>
          <div className="text-orange-200 text-xs mt-2">≥ 20% 涨幅项</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/20">
          <div className="text-amber-100 text-sm font-medium">需关注波动</div>
          <div className="text-4xl font-bold mt-3 tracking-tight">{warningFluc}</div>
          <div className="text-amber-200 text-xs mt-2">10% ~ 20% 波动</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-100">
          <div className="flex">
            {[
              { key: "quotes", label: "报价管理", icon: "📋" },
              { key: "fluctuations", label: "价格波动明细", icon: "📈" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.key === "fluctuations" && fluctuationsList.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                    {fluctuationsList.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "quotes" && (
          <div>
            <div className="p-6 border-b border-slate-100 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
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
                {(Object.keys(STATUS_MAP) as QuoteStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      statusFilter === s
                        ? "bg-slate-900 text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {STATUS_MAP[s].label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate("/admin/comparison")}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg shadow hover:shadow-md transition"
              >
                进入比价中心 →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">报价单号</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">供应商</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">关联需求</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">报价总额</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase">明细数</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">有效期至</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">提交时间</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">状态</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quoteList
                    .filter(q => !statusFilter || q.status === statusFilter)
                    .map(quote => (
                    <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 font-mono text-sm font-semibold text-blue-600">
                        {quote.code}
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-medium text-slate-800">{quote.supplierName}</div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600 font-mono">
                        {quote.purchaseRequestId?.slice(0, 10)}...
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="font-bold text-slate-800">{formatMoney(quote.totalAmount)}</div>
                        {quote.totalWithTax && (
                          <div className="text-xs text-slate-500">含税 {formatMoney(quote.totalWithTax)}</div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                          {quote.items.length}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">{formatDate(quote.validityDate)}</td>
                      <td className="px-6 py-5 text-sm text-slate-500">{formatDateTime(quote.submittedAt)}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_MAP[quote.status].color}`}>
                          {STATUS_MAP[quote.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-3">
                          <button
                            onClick={() => navigate(`/documents/quote/${quote.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            查看详情
                          </button>
                          {quote.status === "submitted" && (
                            <button
                              onClick={async () => {
                                const res = await api.post(`/api/quotes/${quote.id}/select`, {
                                  purchaseRequestId: quote.purchaseRequestId
                                });
                                if (res.success) {
                                  alert("已选中该报价！");
                                  window.location.reload();
                                }
                              }}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              选中此单
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "fluctuations" && (
          <div className="p-6">
            <div className="mb-5 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-amber-900">价格波动预警说明</p>
                  <p className="text-sm text-amber-800 mt-1">
                    系统自动监测每种材料同一供应商的历史报价，当波动幅度 ≥ 10% 时产生预警。红色标注为超过 20% 的重大异常波动。
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase">材料名称</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase">规格型号</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase">供应商</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold text-slate-500 uppercase">上次价格</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold text-slate-500 uppercase">当前价格</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold text-slate-500 uppercase">波动金额</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold text-slate-500 uppercase">涨跌幅</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase">发生时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fluctuationsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                        <div className="text-5xl mb-3">✅</div>
                        <p className="font-medium">暂无异常价格波动</p>
                        <p className="text-sm text-slate-400 mt-1">市场价格平稳</p>
                      </td>
                    </tr>
                  ) : (
                    fluctuationsList
                      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
                      .map((f, idx) => {
                      const isCritical = Math.abs(f.changePercent) >= 20;
                      const isUp = f.changePercent > 0;
                      return (
                        <tr key={idx} className={isCritical ? "bg-red-50/40" : "hover:bg-slate-50/50"}>
                          <td className="px-5 py-4 font-medium text-slate-800">{f.materialName}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{f.specification}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{f.supplierName}</td>
                          <td className="px-5 py-4 text-right text-sm text-slate-600 line-through">{formatMoney(f.previousPrice)}</td>
                          <td className="px-5 py-4 text-right text-sm font-semibold text-slate-800">{formatMoney(f.currentPrice)}</td>
                          <td className={`px-5 py-4 text-right text-sm font-semibold ${isUp ? "text-red-600" : "text-green-600"}`}>
                            {isUp ? "+" : ""}{formatMoney(f.changeAmount)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                              isCritical
                                ? isUp ? "bg-red-600 text-white" : "bg-green-600 text-white"
                                : isUp ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                            }`}>
                              {isUp ? "↑" : "↓"} {Math.abs(f.changePercent).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">{formatDate(f.date)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
