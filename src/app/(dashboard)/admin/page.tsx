'use client';

import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users2,
  ScrollText,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useSession } from '@/components/providers/SessionProvider';
import {
  cn,
  ACTION_LABEL,
  formatDateTime,
} from '@/lib/utils';
import type { LogAction, OwnershipStat } from '@/types';

interface DashboardStats {
  total: number;
  inProgress: number;
  completed: number;
  delayed: number;
  pendingClaim: number;
  delayRate: number;
  completionRate: number;
}

interface LogItem {
  id: string;
  action: LogAction;
  createdAt: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  operator: { id: string; name: string; role: string };
  task?: { id: string; title: string } | null;
}

export default function AdminHomePage() {
  const { user } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-home-statistics'],
    queryFn: async () => {
      const [statsRes, logsRes] = await Promise.all([
        fetch('/api/statistics'),
        fetch('/api/logs?pageSize=10'),
      ]);
      const [statsJson, logsJson] = await Promise.all([
        statsRes.json(),
        logsRes.json(),
      ]);
      if (!statsJson.success) throw new Error(statsJson.error);
      if (!logsJson.success) throw new Error(logsJson.error);
      return {
        ownership: statsJson.data.ownership as OwnershipStat[],
        dashboard: statsJson.data.dashboard as DashboardStats,
        logs: logsJson.data.items as LogItem[],
      };
    },
    enabled: !!user,
  });

  const top5 = [...(data?.ownership || [])]
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 5)
    .map((o) => ({
      name: o.userName,
      department: o.department || '-',
      总数: o.totalCount,
      完成: o.completedCount,
      进行中: o.inProgressCount,
      延期: o.delayedCount,
    }));

  const delayRate = data?.dashboard.delayRate || 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          管理首页
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          快速查看平台整体运营状况和最近动态
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">加载中...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="总待办"
              value={data?.dashboard.total || 0}
              icon={<ListTodo className="w-5 h-5" />}
              color="primary"
            />
            <StatCard
              label="进行中"
              value={data?.dashboard.inProgress || 0}
              icon={<Clock className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              label="已完成"
              value={data?.dashboard.completed || 0}
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="emerald"
            />
            <StatCard
              label="延期率"
              value={`${delayRate}%`}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="card-base p-5 lg:col-span-3">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Users2 className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-semibold text-slate-900">
                    责任归属 Top 5
                  </h2>
                </div>
                <a
                  href="/admin/statistics"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  查看全部 <ChevronRight className="w-3 h-3" />
                </a>
              </div>
              <div className="h-[320px]">
                {top5.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={top5}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" fontSize={11} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={70}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          fontSize: '12px',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                      <Bar
                        dataKey="总数"
                        stackId="a"
                        radius={[0, 0, 0, 4]}
                        barSize={22}
                      >
                        {top5.map((_, idx) => (
                          <Cell key={`cell-total-${idx}`} fill="#1e3a5f" />
                        ))}
                      </Bar>
                      <Bar dataKey="完成" stackId="a" barSize={22}>
                        {top5.map((_, idx) => (
                          <Cell key={`cell-done-${idx}`} fill="#10b981" />
                        ))}
                      </Bar>
                      <Bar dataKey="进行中" stackId="a" barSize={22}>
                        {top5.map((_, idx) => (
                          <Cell key={`cell-ip-${idx}`} fill="#0ea5e9" />
                        ))}
                      </Bar>
                      <Bar
                        dataKey="延期"
                        stackId="a"
                        radius={[4, 4, 0, 0]}
                        barSize={22}
                      >
                        {top5.map((_, idx) => (
                          <Cell key={`cell-dl-${idx}`} fill="#f59e0b" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    暂无数据
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                <Legend color="#1e3a5f" label="总数" />
                <Legend color="#10b981" label="已完成" />
                <Legend color="#0ea5e9" label="进行中" />
                <Legend color="#f59e0b" label="已延期" />
              </div>
            </div>

            <div className="card-base p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-semibold text-slate-900">
                    最近 10 条操作日志
                  </h2>
                </div>
                <a
                  href="/admin/logs"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  完整审计 <ChevronRight className="w-3 h-3" />
                </a>
              </div>
              <div className="space-y-3 max-h-[340px] overflow-y-auto scrollbar-thin pr-1">
                {(data?.logs || []).length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    暂无日志
                  </div>
                ) : (
                  (data?.logs || []).map((log) => {
                    const act = ACTION_LABEL[log.action] || {
                      label: log.action,
                      className: 'bg-slate-50 text-slate-600',
                    };
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <span
                          className={cn(
                            'badge shrink-0 !py-1 !text-[11px]',
                            act.className
                          )}
                        >
                          {act.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-800 leading-tight">
                            <span className="font-medium">{log.operator.name}</span>
                            {log.task && (
                              <span className="text-slate-500 mx-1">·</span>
                            )}
                            {log.task && (
                              <span
                                className="text-primary hover:underline cursor-pointer"
                                title={log.task.title}
                              >
                                {log.task.title}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                            {formatDateTime(log.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'primary' | 'blue' | 'amber' | 'emerald';
}) {
  const colorMap = {
    primary: 'bg-primary/5 text-primary border-primary/10',
    blue: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  const iconBgMap = {
    primary: 'bg-primary/10',
    blue: 'bg-sky-100/70',
    amber: 'bg-amber-100/70',
    emerald: 'bg-emerald-100/70',
  };
  return (
    <div className={cn('card-base p-5 border', colorMap[color])}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-600 mb-2">{label}</div>
          <div className="text-3xl font-bold font-mono tabular-nums">{value}</div>
        </div>
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            iconBgMap[color]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-slate-500">{label}</span>
    </div>
  );
}
