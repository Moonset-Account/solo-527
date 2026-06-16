'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Users, Clock, CalendarCheck, TrendingUp, ArrowUpRight, ArrowDownRight, Phone, MessageSquare, Home, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Link from 'next/link';

export default function Dashboard() {
  const { dashboardStats, trendData, leads, followUps, users, currentUser } = useAppStore();

  const myLeads = leads.filter(
    (l) => !l.is_in_pool && (l.assignee_id === currentUser?.id || currentUser?.role === 'super_admin' || currentUser?.role === 'sales_manager')
  );

  const todayFollowups = followUps
    .filter((f) => f.next_follow_up_at && new Date(f.next_follow_up_at) < new Date(Date.now() + 24 * 60 * 60 * 1000))
    .slice(0, 5);

  const statsCards = [
    {
      title: '今日新增线索',
      value: dashboardStats.today_new_leads,
      icon: Users,
      gradient: 'gradient-card-blue',
      change: dashboardStats.leads_change,
      suffix: '条',
    },
    {
      title: '待跟进数',
      value: dashboardStats.pending_follow_ups,
      icon: Clock,
      gradient: 'gradient-card-orange',
      change: dashboardStats.followup_change,
      suffix: '个',
    },
    {
      title: '本周量房',
      value: dashboardStats.upcoming_surveys,
      icon: CalendarCheck,
      gradient: 'gradient-card-purple',
      change: dashboardStats.survey_change,
      suffix: '次',
    },
    {
      title: '预计成交金额',
      value: dashboardStats.predicted_revenue,
      icon: TrendingUp,
      gradient: 'gradient-card-green',
      change: dashboardStats.revenue_change,
      suffix: '元',
      isCurrency: true,
    },
  ];

  const methodIcon: Record<string, any> = { phone: Phone, wechat: MessageSquare, visit: Home, other: MessageSquare };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-5">
          {statsCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.title}
                className="overflow-hidden border-0 text-white shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
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
                    <div className="flex items-center gap-1 mt-3 text-xs">
                      {s.change >= 0 ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      <span className="font-medium">{Math.abs(s.change)}%</span>
                      <span className="text-white/60 ml-0.5">较上周</span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-5">
          <Card className="col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-gray-900">近 30 天成交趋势</h3>
                  <p className="text-sm text-gray-500 mt-0.5">新增线索与成交金额走势</p>
                </div>
                <Badge variant="success" dot>实时数据</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                        fontSize: 12,
                      }}
                      formatter={(value: any) => (typeof value === 'number' && value > 10000 ? formatCurrency(value) : value)}
                    />
                    <Line type="monotone" dataKey="新增线索" stroke="#1E3A5F" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="成交金额" stroke="#D4A853" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">今日待办</h3>
                <span className="text-xs text-primary-600 font-medium cursor-pointer hover:underline">查看全部</span>
              </div>
              <div className="space-y-2.5">
                {myLeads.filter((l) => l.auto_recycle_at).slice(0, 3).map((l) => (
                  <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        {l.customer_name}
                        <Badge variant="danger" className="text-[10px] h-4">即将回收</Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        已 {formatRelativeTime(l.updated_at)} 未跟进
                      </div>
                    </div>
                  </div>
                ))}
                {todayFollowups.map((f) => {
                  const Icon = methodIcon[f.method] || MessageSquare;
                  return (
                    <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {leads.find((l) => l.id === f.lead_id)?.customer_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{f.content}</div>
                      </div>
                    </div>
                  );
                })}
                {myLeads.filter((l) => l.auto_recycle_at).length === 0 && todayFollowups.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">暂无待办事项，干得漂亮！ 🎉</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">最近线索</h3>
                <p className="text-sm text-gray-500 mt-0.5">最新录入的客户线索</p>
              </div>
              <Link href="/pipeline" className="text-sm text-primary-600 font-medium hover:underline">
                查看管道 →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">客户</th>
                    <th className="pb-3 font-medium">小区</th>
                    <th className="pb-3 font-medium">面积/预算</th>
                    <th className="pb-3 font-medium">阶段</th>
                    <th className="pb-3 font-medium">负责人</th>
                    <th className="pb-3 font-medium">最近更新</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leads.slice(0, 6).map((l) => {
                    const stage = useAppStore.getState().stages.find((s) => s.id === l.stage_id);
                    return (
                      <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full gradient-card-blue flex items-center justify-center text-white text-xs font-semibold">
                              {l.customer_name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{l.customer_name}</div>
                              <div className="text-xs text-gray-400">{l.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-gray-600">{l.community || '-'}</td>
                        <td className="py-3 text-gray-600">
                          <span className="font-mono text-xs">
                            {l.area || '-'}㎡ / {formatCurrency(l.budget_min)}-{formatCurrency(l.budget_max)}
                          </span>
                        </td>
                        <td className="py-3">
                          {stage && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: stage.color + '15', color: stage.color }}
                            >
                              {stage.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-gray-600">{l.assignee_name || <span className="text-gray-400">未分配</span>}</td>
                        <td className="py-3 text-gray-400 text-xs">{formatRelativeTime(l.updated_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
