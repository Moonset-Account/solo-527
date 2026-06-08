'use client';

import { useAdjustmentStore } from '@/lib/use-adjustment-store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { ArrowLeft, ArrowRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import Link from 'next/link';

export default function ReviewPage() {
  const { orders, getAllAdjustments } = useAdjustmentStore();
  const allAdjustments = getAllAdjustments();

  const comparisonData = allAdjustments.map((adj) => ({
    name: `${adj.orderNo}`,
    调整前: adj.beforeDelayRisk,
    调整后: adj.afterDelayRisk,
    变化: adj.afterDelayRisk - adj.beforeDelayRisk,
  }));

  const overallBefore = allAdjustments.length > 0
    ? +(allAdjustments.reduce((s, a) => s + a.beforeDelayRisk, 0) / allAdjustments.length).toFixed(1)
    : 0;
  const overallAfter = allAdjustments.length > 0
    ? +(allAdjustments.reduce((s, a) => s + a.afterDelayRisk, 0) / allAdjustments.length).toFixed(1)
    : 0;
  const riskChange = overallAfter - overallBefore;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />返回看板
          </Link>
          <h1 className="text-2xl font-bold text-white">优先级复盘对比</h1>
          <span className="text-xs text-slate-500">读取同一调整记录源</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 text-center">
            <div className="text-red-400 text-3xl font-bold">{overallBefore}%</div>
            <div className="text-slate-400 text-sm mt-1">调整前平均延期风险</div>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-emerald-400 text-3xl font-bold">{overallAfter}%</span>
              <span className={`flex items-center gap-0.5 text-sm font-medium ${riskChange < 0 ? 'text-emerald-400' : riskChange > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {riskChange < 0 ? <TrendingDown className="w-4 h-4" /> : riskChange > 0 ? <TrendingUp className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                {riskChange > 0 ? '+' : ''}{riskChange}%
              </span>
            </div>
            <div className="text-slate-400 text-sm mt-1">调整后平均延期风险</div>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 text-center">
            <div className="text-indigo-400 text-3xl font-bold">{allAdjustments.length}</div>
            <div className="text-slate-400 text-sm mt-1">调整次数</div>
          </div>
        </div>

        {allAdjustments.length > 0 && (
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 mb-6">
            <h3 className="text-white font-semibold text-base mb-4">调整前后延期风险对比</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={comparisonData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} label={{ value: '延期风险%', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8, color: '#f1f5f9' }} />
                <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '高风险阈值', fill: '#ef4444', fontSize: 10 }} />
                <Bar dataKey="调整前" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="调整后" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold text-base mb-4">调整明细记录（与看板同源）</h3>
          {allAdjustments.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-8">暂无优先级调整记录，请在看板中调整工单优先级</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700/50">
                    <th className="text-left py-2 px-3">工单号</th>
                    <th className="text-left py-2 px-3">客户</th>
                    <th className="text-left py-2 px-3">产品</th>
                    <th className="text-left py-2 px-3">调整时间</th>
                    <th className="text-left py-2 px-3">调整人</th>
                    <th className="text-center py-2 px-3">优先级变化</th>
                    <th className="text-center py-2 px-3">调整前风险</th>
                    <th className="text-center py-2 px-3">调整后风险</th>
                    <th className="text-center py-2 px-3">变化</th>
                    <th className="text-left py-2 px-3">原因</th>
                    <th className="text-left py-2 px-3">影响下游工序</th>
                  </tr>
                </thead>
                <tbody>
                  {allAdjustments.map((adj) => {
                    const change = adj.afterDelayRisk - adj.beforeDelayRisk;
                    return (
                      <tr key={adj.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-200 font-mono">{adj.orderNo}</td>
                        <td className="py-2 px-3 text-slate-300">{adj.customer}</td>
                        <td className="py-2 px-3 text-slate-400">{adj.product}</td>
                        <td className="py-2 px-3 text-slate-400">{adj.adjustedAt.replace('T', ' ').slice(0, 16)}</td>
                        <td className="py-2 px-3 text-slate-300">{adj.adjustedBy}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-slate-400">P{adj.oldPriority}</span>
                            <ArrowRight className="w-3 h-3 text-indigo-400" />
                            <span className="text-indigo-400 font-medium">P{adj.newPriority}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-red-400">{adj.beforeDelayRisk}%</td>
                        <td className="py-2 px-3 text-center text-emerald-400">{adj.afterDelayRisk}%</td>
                        <td className={`py-2 px-3 text-center font-medium ${change < 0 ? 'text-emerald-400' : change > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {change > 0 ? '+' : ''}{change}%
                        </td>
                        <td className="py-2 px-3 text-slate-400 max-w-[200px] truncate">{adj.reason}</td>
                        <td className="py-2 px-3 text-slate-500">
                          {adj.affectedDownstreamSteps.map((s) => `工序${s.split('-').pop()}`).join(', ')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold text-base mb-4">各工单当前优先级及调整历史</h3>
          <div className="grid grid-cols-2 gap-3">
            {orders.filter((wo) => wo.priorityAdjustments.length > 0).map((wo) => (
              <div key={wo.id} className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-200 text-xs font-mono">{wo.orderNo}</span>
                  <span className="text-indigo-400 text-xs">当前优先级 P{wo.priority}</span>
                </div>
                <div className="text-slate-400 text-[10px] mb-1">{wo.customer} · {wo.product}</div>
                <div className="space-y-1">
                  {wo.priorityAdjustments.map((adj) => (
                    <div key={adj.id} className="flex items-center gap-2 text-[10px]">
                      <span className="text-slate-500">{adj.adjustedAt.replace('T', ' ').slice(0, 16)}</span>
                      <span className="text-slate-400">P{adj.oldPriority}→P{adj.newPriority}</span>
                      <span className="text-red-400">{adj.beforeDelayRisk}%</span>
                      <ArrowRight className="w-2.5 h-2.5 text-indigo-400" />
                      <span className="text-emerald-400">{adj.afterDelayRisk}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
