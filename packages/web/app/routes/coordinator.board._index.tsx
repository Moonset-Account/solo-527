import { json, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import type { ApiResponse, ApprovalBoardItem, DashboardStatus } from "@app/shared";
import { api, formatDate, formatDateTime } from "~/lib/api";

export const loader = async ({ request }) => {
  const stats = await api.get<any>("/api/suppliers/approval-board/stats");
  return json({ stats: stats.data || {} });
};

const STATUS_MAP: Record<DashboardStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "待处理", color: "text-orange-700", bg: "bg-orange-100" },
  approved: { label: "已通过", color: "text-emerald-700", bg: "bg-emerald-100" },
  rejected: { label: "已驳回", color: "text-red-700", bg: "bg-red-100" },
};

export default function ApprovalBoard() {
  const { stats } = useLoaderData<typeof loader>();
  const [viewMode, setViewMode] = useState<"stats" | "list">("stats");

  const items: ApprovalBoardItem[] = stats.items || [];
  const monthlyStats = stats.monthlyStats || [];

  const maxMonthly = Math.max(...monthlyStats.map((m: any) => m.count), 1);
  const maxDuration = Math.max(...items.map(i => i.durationHours || 0), 1);

  const avgDuration = stats.avgDuration || 0;
  const targetDuration = 24;
  const isOnTrack = avgDuration <= targetDuration;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-7 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full"></div>
          <div className="absolute -right-8 top-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center gap-3 text-white/80">
              <span className="text-3xl">⏱️</span>
              <span className="text-sm font-medium tracking-wide uppercase">平均审批时长</span>
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-6xl font-bold tracking-tight">
                {avgDuration.toFixed(1)}
              </span>
              <span className="text-2xl text-white/80 font-medium">小时</span>
            </div>
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              isOnTrack ? "bg-emerald-400/30 text-emerald-100" : "bg-red-400/30 text-red-100"
            }`}>
              {isOnTrack ? "✅ 达标" : "⚠️ 超时"}
              <span className="text-white/70 ml-1">
                (目标 ≤ {targetDuration}h)
              </span>
            </div>
            <div className="mt-7 pt-6 border-t border-white/20">
              <div className="text-xs text-white/60 mb-2">审批进度条 ({((avgDuration / targetDuration) * 100).toFixed(0)}%)</div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur">
                <div
                  className={`h-full rounded-full transition-all ${
                    isOnTrack
                      ? "bg-gradient-to-r from-emerald-400 to-green-400"
                      : "bg-gradient-to-r from-orange-400 to-red-400"
                  }`}
                  style={{ width: `${Math.min((avgDuration / targetDuration) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { label: "总处理单数", value: stats.total || 0, icon: "📋", color: "from-slate-600 to-slate-800" },
            { label: "已通过", value: stats.approved || 0, icon: "✅", color: "from-emerald-500 to-teal-600" },
            { label: "待处理", value: stats.pending || 0, icon: "⏳", color: "from-amber-500 to-orange-500" },
            { label: "已驳回", value: stats.rejected || 0, icon: "❌", color: "from-rose-500 to-red-600" },
          ].map((card, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className={`absolute right-0 top-0 w-20 h-20 bg-gradient-to-br ${card.color} opacity-5 rounded-bl-3xl group-hover:opacity-10 transition-opacity`}></div>
              <div className="text-3xl mb-3">{card.icon}</div>
              <div className="text-sm text-slate-500 font-medium">{card.label}</div>
              <div className="mt-2 text-4xl font-bold text-slate-800 tracking-tight">
                {card.value.toLocaleString()}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                {stats.total > 0
                  ? `${((card.value / (stats.total || 1)) * 100).toFixed(1)}% 占比`
                  : "暂无数据"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">📊 审批时长月度趋势</h2>
            <p className="text-sm text-slate-500 mt-1">每月处理单数与平均审批时长统计（数据写入时自动更新）</p>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("stats")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === "stats" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              月度统计
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === "list" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              明细列表
            </button>
          </div>
        </div>

        {viewMode === "stats" && (
          <div className="p-6">
            {monthlyStats.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <div className="text-6xl mb-4">📊</div>
                <p className="font-medium text-lg">暂无月度统计数据</p>
                <p className="text-sm mt-2">处理资质异常提醒后，审批时长将自动记录于此</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500"></span>
                    月度处理单量
                  </h3>
                  <div className="space-y-4">
                    {monthlyStats
                      .slice()
                      .sort((a: any, b: any) => (a.month > b.month ? 1 : -1))
                      .map((m: any, idx: number) => {
                        const width = (m.count / maxMonthly) * 100;
                        return (
                          <div key={idx}>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="font-semibold text-slate-700 w-20">{m.month}</span>
                              <span className="text-slate-500">
                                <span className="font-bold text-slate-800 text-lg">{m.count}</span> 单
                              </span>
                            </div>
                            <div className="h-9 bg-slate-100 rounded-xl overflow-hidden relative">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-xl transition-all duration-500 flex items-center justify-end pr-3"
                                style={{ width: `${Math.max(width, 3)}%` }}
                              >
                                {width > 20 && (
                                  <span className="text-white text-xs font-bold">
                                    {m.count} 单
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500"></span>
                    月度平均审批时长
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {monthlyStats
                      .slice()
                      .sort((a: any, b: any) => (a.month > b.month ? 1 : -1))
                      .map((m: any, idx: number) => {
                        const isGood = m.avgDuration <= targetDuration;
                        return (
                          <div
                            key={idx}
                            className={`p-5 rounded-2xl border-2 ${
                              isGood
                                ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
                                : "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
                            }`}
                          >
                            <div className="text-xs font-semibold text-slate-500">{m.month}</div>
                            <div className="mt-2 flex items-baseline gap-2">
                              <span className={`text-4xl font-bold tracking-tight ${
                                isGood ? "text-emerald-700" : "text-orange-700"
                              }`}>
                                {m.avgDuration.toFixed(1)}
                              </span>
                              <span className="text-sm text-slate-500">小时</span>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold ${
                                isGood ? "bg-emerald-200/60 text-emerald-800" : "bg-orange-200/60 text-orange-800"
                              }`}>
                                {isGood ? "✅ 达标" : "⚠️ 超时"}
                              </span>
                              <span className="text-slate-500">共 {m.count} 单</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === "list" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">供应商</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">资质问题</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">问题类型</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">处理人</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase">状态</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">收单时间</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">审批时长</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                      <div className="text-5xl mb-3">📝</div>
                      <p className="font-medium">暂无审批明细</p>
                      <p className="text-sm mt-1">完成资质异常处理后，数据将自动同步至此</p>
                    </td>
                  </tr>
                ) : (
                  items.map((item: any) => {
                    const st = STATUS_MAP[item.status];
                    const durationColor = item.durationHours <= targetDuration
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-orange-700 bg-orange-50";
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-semibold text-slate-800">{item.supplierName}</div>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-700">{item.qualificationName}</td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                            item.issueType === "expired" || item.issueType === "invalid"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {item.issueType === "expired" ? "已过期" : item.issueType === "expiring" ? "即将到期" : "无效"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                              {item.assigneeName?.[0]}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{item.assigneeName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${st.color} ${st.bg}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right text-sm text-slate-600">
                          {formatDateTime(item.receivedAt)}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold ${durationColor}`}>
                            {item.durationHours.toFixed(1)} 小时
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 rounded-2xl p-6 border border-amber-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-200/60 flex items-center justify-center text-2xl shrink-0">
            💡
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-amber-900">月底核对差异说明</h3>
            <p className="text-sm text-amber-800 mt-2 leading-relaxed">
              本看板数据在供应商协同员处理完成资质异常时<strong>自动写入</strong>，不可人工修改。
              所有记录包含：供应商、资质问题类型、处理人、接收时间、完成时间、审批时长。
              月底可通过"月度统计"视图汇总本月平均审批时长，与KPI目标（{targetDuration}小时）进行对比，
              差异数据可导出用于绩效评估。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
