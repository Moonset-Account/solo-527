'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/lib/store';
import { cn, formatCurrency } from '@/lib/utils';
import { TrendingUp, Target, Award, ArrowUpRight, Users, DollarSign, BarChart3, PieChart } from 'lucide-react';
import {
  FunnelChart,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts';

export default function PredictionPage() {
  const { leads, stages, performanceData, users } = useAppStore();

  const funnelData = stages
    .filter((s) => s.is_active)
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      name: s.name,
      value: leads.filter((l) => l.stage_id === s.id).length,
      color: s.color,
    }));

  const conversionRates = funnelData.map((d, i) => ({
    ...d,
    rate: i === 0 ? 100 : funnelData[i - 1].value > 0 ? Math.round((d.value / funnelData[i - 1].value) * 100) : 0,
  }));

  const predictedRevenue = leads
    .filter((l) => l.budget_max)
    .reduce((sum, l) => {
      const stage = stages.find((s) => s.id === l.stage_id);
      const weight = stage ? (1 - stage.order / 10) : 0.3;
      return sum + (l.budget_max || 0) * weight;
    }, 0);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-5">
          {[
            { title: '预计成交金额', value: predictedRevenue, icon: DollarSign, gradient: 'gradient-card-green', suffix: '元', isCurrency: true },
            { title: '在跟线索数', value: leads.filter((l) => !l.is_in_pool).length, icon: Users, gradient: 'gradient-card-blue', suffix: '条' },
            { title: '整体转化率', value: 23.5, icon: Target, gradient: 'gradient-card-purple', suffix: '%' },
            { title: '本月成交目标', value: 15, icon: Award, gradient: 'gradient-card-orange', suffix: '单 / 目标 20' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="overflow-hidden border-0 text-white shadow-card-hover animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={s.gradient}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-white/70">{s.title}</div>
                        <div className="text-2xl font-bold mt-2 font-mono tracking-tight">
                          {s.isCurrency ? formatCurrency(s.value) : `${s.value}${s.suffix}`}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary-500" />
                  销售转化漏斗
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">各阶段线索数量及转化率</p>
              </div>
              <Badge variant="success" dot>实时数据</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart data={conversionRates}>
                    <Tooltip
                      contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12 }}
                      formatter={(value: any, name: any) => (name === 'rate' ? [`${value}%`, '转化率'] : [value + ' 条', name])}
                    />
                    {/* @ts-ignore */}
                    <Bar dataKey="value" isAnimationActive={false}>
                      {conversionRates.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                {conversionRates.slice(1, 5).map((c) => (
                  <div key={c.name} className="text-center">
                    <div className="text-xs text-gray-400 mb-1">{c.name}转化率</div>
                    <div className="text-lg font-bold font-mono" style={{ color: c.color }}>
                      {c.rate}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent-500" />
                  成交阶段预估
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">按阶段权重预测金额</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {conversionRates
                  .filter((c) => c.value > 0)
                  .map((c) => {
                    const stageLeads = leads.filter((l) => stages.find((s) => s.id === l.stage_id)?.name === c.name);
                    const totalBudget = stageLeads.reduce((s, l) => s + (l.budget_max || 0), 0);
                    return (
                      <div key={c.name} className="p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                            <span className="text-sm font-medium text-gray-800">{c.name}</span>
                            <Badge variant="default" className="text-[10px] h-4">{c.value}条</Badge>
                          </div>
                          <span className="text-sm font-semibold font-mono" style={{ color: c.color }}>
                            {formatCurrency(totalBudget)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (totalBudget / predictedRevenue) * 100 * 2)}%`,
                              backgroundColor: c.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-500" />
                销售顾问业绩排名
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">本月成交金额与转化率对比</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                  <Tooltip
                    contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12 }}
                    formatter={(value: any, name: any) => name === 'revenue' ? formatCurrency(value) : value}
                  />
                  <Bar dataKey="revenue" name="成交金额" fill="#1E3A5F" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
              {performanceData.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold',
                      i === 0 ? 'gradient-gold' : 'gradient-card-blue'
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{p.name}</div>
                    <div className="text-xs text-gray-400">
                      {p.won}单 · 转化率 {p.rate}%
                    </div>
                  </div>
                  <div className="text-sm font-bold font-mono text-primary-600">{formatCurrency(p.revenue)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
