'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  CalendarRange,
  Building2,
  RotateCcw,
  Download,
  Loader2,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend as RechartsLegend,
} from 'recharts';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';
import type { OwnershipStat, TrendDataPoint } from '@/types';

interface DashboardStats {
  total: number;
  inProgress: number;
  completed: number;
  delayed: number;
  pendingClaim: number;
  delayRate: number;
  completionRate: number;
}

export default function StatisticsPage() {
  const { user } = useSession();
  const { toast } = useToast();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [department, setDepartment] = useState('');
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['statistics', { fromDate, toDate, department }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (department) params.set('department', department);
      params.set('weeks', '8');
      const res = await fetch(`/api/statistics?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return {
        ownership: json.data.ownership as OwnershipStat[],
        dashboard: json.data.dashboard as DashboardStats,
        trend: json.data.trend as TrendDataPoint[],
      };
    },
    enabled: !!user,
  });

  const departments = useMemo(() => {
    const set = new Set<string>();
    (data?.ownership || []).forEach((o) => {
      if (o.department) set.add(o.department);
    });
    return Array.from(set);
  }, [data]);

  const avgHours = useMemo(() => {
    const list = data?.ownership || [];
    if (list.length === 0) return 0;
    const total = list.reduce((sum, o) => sum + o.avgProcessingHours, 0);
    return Math.round((total / list.length) * 10) / 10;
  }, [data]);

  const onReset = () => {
    setFromDate('');
    setToDate('');
    setDepartment('');
  };

  const onExport = async () => {
    try {
      const params = new URLSearchParams();
      params.set('format', format);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (department) params.set('department', department);
      const res = await fetch(`/api/tasks/export?${params.toString()}`);
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'xlsx' ? 'xlsx' : 'csv';
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `tasks-statistics-${stamp}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast(`已导出 ${format.toUpperCase()} 文件`, 'success');
    } catch (e: any) {
      toast(e.message || '导出失败', 'error');
    }
  };

  const ownership = data?.ownership || [];
  const trendData = data?.trend || [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <PieChart className="w-6 h-6 text-primary" />
          责任归属统计中心
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          多维度统计待办处理情况，支持按时间、部门筛选和导出
        </p>
      </div>

      <div className="card-base p-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-slate-400 mb-0.5" />
          <div>
            <div className="text-[11px] text-slate-400 mb-1">日期范围</div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input-base !py-2 !text-xs"
              />
              <span className="text-slate-400 text-xs">至</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input-base !py-2 !text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400 mb-0.5" />
          <div>
            <div className="text-[11px] text-slate-400 mb-1">部门</div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="input-base !py-2 !text-xs !w-auto min-w-[140px]"
            >
              <option value="">全部部门</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onReset}
          className="btn-secondary !py-2 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          重置筛选
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-pill border border-slate-200 overflow-hidden p-0.5 bg-slate-50">
            <button
              onClick={() => setFormat('csv')}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-pill text-xs font-medium transition-colors',
                format === 'csv'
                  ? 'bg-white shadow-soft text-primary'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={() => setFormat('xlsx')}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-pill text-xs font-medium transition-colors',
                format === 'xlsx'
                  ? 'bg-white shadow-soft text-primary'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
          <button onClick={onExport} className="btn-primary !py-2 text-xs">
            <Download className="w-3.5 h-3.5" />
            导出数据
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">加载统计数据中...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <BigStatCard
              label="总待办数"
              value={data?.dashboard.total || 0}
              icon={<ListTodo className="w-6 h-6" />}
              color="primary"
              sub={`进行中 ${data?.dashboard.inProgress || 0} · 待认领 ${data?.dashboard.pendingClaim || 0}`}
            />
            <BigStatCard
              label="完成率"
              value={`${data?.dashboard.completionRate || 0}%`}
              icon={<CheckCircle2 className="w-6 h-6" />}
              color="emerald"
              sub={`已完成 ${data?.dashboard.completed || 0} 项`}
            />
            <BigStatCard
              label="延期率"
              value={`${data?.dashboard.delayRate || 0}%`}
              icon={<AlertTriangle className="w-6 h-6" />}
              color="amber"
              sub={`已延期 ${data?.dashboard.delayed || 0} 项`}
            />
            <BigStatCard
              label="平均处理时长"
              value={`${avgHours} h`}
              icon={<Clock3 className="w-6 h-6" />}
              color="blue"
              sub={`共 ${ownership.length} 位成员`}
            />
          </div>

          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                责任归属明细
              </h2>
              <button
                onClick={() => refetch()}
                className="text-xs text-slate-500 hover:text-primary inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                刷新
              </button>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[1.2fr_1fr_70px_70px_80px_70px_160px_90px_100px] gap-3 px-4 py-2.5 bg-slate-50/80 rounded-lg text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  <div>姓名</div>
                  <div>部门</div>
                  <div className="text-center">总数</div>
                  <div className="text-center">完成</div>
                  <div className="text-center">进行中</div>
                  <div className="text-center">延期</div>
                  <div>完成率</div>
                  <div className="text-center">延期率</div>
                  <div className="text-right pr-2">平均时长</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {ownership.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      暂无统计数据，请调整筛选条件
                    </div>
                  ) : (
                    ownership.map((o) => (
                      <div
                        key={o.userId}
                        className="grid grid-cols-[1.2fr_1fr_70px_70px_80px_70px_160px_90px_100px] gap-3 px-4 py-3 items-center hover:bg-slate-50/60 transition-colors text-sm rounded-lg"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary/80 to-accent text-white text-xs font-bold flex items-center justify-center">
                            {o.userName.slice(0, 1)}
                          </div>
                          <span className="font-medium text-slate-800 truncate">
                            {o.userName}
                          </span>
                        </div>
                        <div className="text-slate-600 truncate">
                          {o.department || '-'}
                        </div>
                        <div className="text-center font-mono tabular-nums font-semibold text-slate-800">
                          {o.totalCount}
                        </div>
                        <div className="text-center font-mono tabular-nums text-emerald-600">
                          {o.completedCount}
                        </div>
                        <div className="text-center font-mono tabular-nums text-sky-600">
                          {o.inProgressCount}
                        </div>
                        <div className="text-center font-mono tabular-nums text-amber-600">
                          {o.delayedCount}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 progress-track">
                              <div
                                className={cn(
                                  'progress-fill',
                                  o.completionRate >= 80
                                    ? 'bg-emerald-500'
                                    : o.completionRate >= 50
                                      ? 'bg-sky-500'
                                      : 'bg-amber-500'
                                )}
                                style={{ width: `${o.completionRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono tabular-nums text-slate-600 shrink-0 w-11 text-right">
                              {o.completionRate}%
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <span
                            className={cn(
                              'font-mono tabular-nums text-sm',
                              o.delayRate > 10
                                ? 'text-danger'
                                : o.delayRate > 0
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                            )}
                          >
                            {o.delayRate}%
                          </span>
                        </div>
                        <div className="text-right pr-2 font-mono tabular-nums text-slate-700">
                          {o.avgProcessingHours} h
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-primary" />
                状态趋势（近 8 周）
              </h2>
            </div>
            <div className="h-[360px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" fontSize={11} tickLine={false} />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        fontSize: '12px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <RechartsLegend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                      iconType="circle"
                    />
                    <Line
                      type="monotone"
                      dataKey="inProgress"
                      name="进行中"
                      stroke="#0ea5e9"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#0ea5e9' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="已完成"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#10b981' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="delayed"
                      name="已延期"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#f59e0b' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  暂无趋势数据
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BigStatCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'primary' | 'emerald' | 'amber' | 'blue';
  sub?: string;
}) {
  const colorMap = {
    primary: {
      bg: 'bg-primary/5 border-primary/10',
      icon: 'bg-primary/10 text-primary',
      text: 'text-primary',
    },
    emerald: {
      bg: 'bg-emerald-50 border-emerald-100',
      icon: 'bg-emerald-100/70 text-emerald-600',
      text: 'text-emerald-700',
    },
    amber: {
      bg: 'bg-amber-50 border-amber-100',
      icon: 'bg-amber-100/70 text-amber-600',
      text: 'text-amber-700',
    },
    blue: {
      bg: 'bg-sky-50 border-sky-100',
      icon: 'bg-sky-100/70 text-sky-600',
      text: 'text-sky-700',
    },
  };
  const c = colorMap[color];
  return (
    <div className={cn('card-base p-6 border', c.bg)}>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-12 h-12 shrink-0 rounded-xl flex items-center justify-center',
            c.icon
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-500 mb-1">{label}</div>
          <div
            className={cn(
              'text-3xl font-bold font-mono tabular-nums leading-tight',
              c.text
            )}
          >
            {value}
          </div>
          {sub && (
            <div className="mt-1.5 text-xs text-slate-400 truncate">{sub}</div>
          )}
        </div>
      </div>
    </div>
  );
}
