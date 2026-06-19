'use client';

import {
  CarFront,
  Package,
  ClipboardCheck,
  Wrench,
  AlertTriangle,
  ArrowUpRight,
  ListTodo,
  CalendarClock,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { StatCard, Badge, DataTable } from '@/components/DataTable';
import {
  workOrderStatusLabel,
  workOrderStatusColor,
  formatDate,
  formatCurrency,
  cn,
  changeStatusLabel,
  changeStatusColor,
} from '@/lib/utils';

const WEEKLY_TURNOVER = [
  { day: '周一', 入库: 32, 出库: 28 },
  { day: '周二', 入库: 15, 出库: 42 },
  { day: '周三', 入库: 48, 出库: 35 },
  { day: '周四', 入库: 22, 出库: 50 },
  { day: '周五', 入库: 38, 出库: 45 },
  { day: '周六', 入库: 12, 出库: 60 },
  { day: '周日', 入库: 0, 出库: 18 },
];

const REVENUE_TREND = [
  { day: '6/14', 营收: 18500 },
  { day: '6/15', 营收: 22300 },
  { day: '6/16', 营收: 19800 },
  { day: '6/17', 营收: 28600 },
  { day: '6/18', 营收: 24100 },
  { day: '6/19', 营收: 31200 },
  { day: '6/20', 营收: 15800 },
];

export default function DashboardPage() {
  const vehicles = useAppStore((s) => s.vehicles);
  const parts = useAppStore((s) => s.parts);
  const workOrders = useAppStore((s) => s.workOrders);
  const inspections = useAppStore((s) => s.qualityInspections);
  const turnovers = useAppStore((s) => s.partTurnovers);
  const orderChanges = useAppStore((s) => s.orderChanges);
  const callbacks = useAppStore((s) => s.callbacks);
  const schedules = useAppStore((s) => s.teamSchedules);

  const todayVehicles = vehicles.length;
  const inProgress = workOrders.filter(
    (w) => w.status === 'in_progress' || w.status === 'assigned',
  ).length;
  const lowStock = parts.filter((p) => p.stock <= p.min_stock).length;
  const pendingInspection = workOrders.filter((w) => w.status === 'quality_check').length;
  const failedCallbacks = callbacks.filter((c) => c.status === 'failed').length;
  const openChanges = orderChanges.filter((c) => c.status !== 'closed').length;

  const weeklyTotal = turnovers.reduce((sum, t) => sum + (t.type === 'out' ? t.quantity : 0), 0);

  const todayTodos = [
    { label: '待派工工单', count: workOrders.filter((w) => w.status === 'pending').length, href: '/workorders', icon: Wrench },
    { label: '待办排期', count: schedules.filter(() => true).length, href: '/production/schedule', icon: CalendarClock },
    { label: '待质检工单', count: pendingInspection, href: '/quality', icon: ClipboardCheck },
    { label: '待处理变更', count: openChanges, href: '/order-changes', icon: AlertTriangle },
    { label: '回调异常', count: failedCallbacks, href: '/callbacks', icon: AlertTriangle },
  ];

  const recentWorkOrders = [...workOrders]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);

  const totalRevenue = workOrders
    .filter((w) => w.status === 'completed')
    .reduce((s) => s + 1280, 0) + 28600;

  return (
    <div>
      <PageHeader
        title="工作台"
        description="今日门店运营总览，关键数据一目了然。"
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="今日登记车辆"
          value={todayVehicles}
          trend="较昨日 +2"
          trendUp
          icon={<CarFront className="w-5 h-5" />}
          accent="default"
          onClick={() => (window.location.href = '/vehicles')}
        />
        <StatCard
          label="在修车辆"
          value={inProgress}
          icon={<Wrench className="w-5 h-5" />}
          accent="warn"
          onClick={() => (window.location.href = '/workorders')}
        />
        <StatCard
          label="配件库存预警"
          value={lowStock}
          trend={`含 ${Math.max(0, lowStock - 1)} 个紧急`}
          icon={<Package className="w-5 h-5" />}
          accent="danger"
          onClick={() => (window.location.href = '/parts')}
        />
        <StatCard
          label="待质检"
          value={pendingInspection}
          icon={<ClipboardCheck className="w-5 h-5" />}
          accent="success"
          onClick={() => (window.location.href = '/quality')}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-slate-800">门店周营收趋势</div>
              <div className="text-xs text-slate-500 mt-0.5">
                累计 {formatCurrency(totalRevenue)} · 本周配件出库 {weeklyTotal} 件
              </div>
            </div>
            <Link
              href="/workorders"
              className="text-xs text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              查看工单 <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_TREND} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E3A5F" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#1E3A5F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Line
                  type="monotone"
                  dataKey="营收"
                  stroke="#1E3A5F"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#1E3A5F' }}
                  activeDot={{ r: 5, fill: '#F59E0B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo className="w-4 h-4 text-brand-600" />
            <div className="font-semibold text-slate-800">今日待办</div>
          </div>
          <ul className="space-y-2">
            {todayTodos.map((t) => {
              const Icon = t.icon;
              const danger = t.count > 0 && (t.label.includes('异常') || t.label.includes('变更') || t.label.includes('库存'));
              return (
                <li key={t.label}>
                  <Link
                    href={t.href}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50/40 transition',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700">{t.label}</span>
                    </div>
                    <Badge
                      className={cn(
                        danger && t.count > 0
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-700',
                      )}
                    >
                      {t.count}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-slate-800">本周配件周转</div>
              <div className="text-xs text-slate-500 mt-0.5">入库 vs 出库数量对比</div>
            </div>
            <Link
              href="/parts/turnover"
              className="text-xs text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              周转明细 <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_TURNOVER} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="入库" fill="#10B981" radius={[6, 6, 0, 0]} barSize={18} />
                <Bar dataKey="出库" fill="#1E3A5F" radius={[6, 6, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-accent-500" />
            <div className="font-semibold text-slate-800">订单变更监控</div>
          </div>
          {orderChanges.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-6">暂无变更记录</div>
          ) : (
            <ul className="space-y-3">
              {orderChanges.slice(0, 4).map((oc) => (
                <li key={oc.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-slate-800 truncate pr-2">
                      {oc.change_type}
                    </div>
                    <Badge className={changeStatusColor[oc.status]}>
                      {changeStatusLabel[oc.status]}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-2 mb-1">
                    {oc.content}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    责任人：{oc.responsible_name} · {formatDate(oc.created_at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/order-changes"
            className="mt-2 block text-xs text-brand-600 hover:text-brand-700"
          >
            查看全部变更 →
          </Link>
        </div>
      </section>

      <section className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-slate-800">最近工单</div>
          <Link
            href="/workorders"
            className="text-xs text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
          >
            全部工单 <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <DataTable
          data={recentWorkOrders}
          rowKey={(r) => r.id}
          onRowClick={(r) => (window.location.href = `/workorders/${r.id}`)}
          columns={[
            { key: 'title', header: '工单名称' },
            {
              key: 'vehicle',
              header: '车辆',
              render: (r) => (
                <div>
                  <div className="font-medium">{r.vehicle_plate}</div>
                  <div className="text-xs text-slate-500">
                    {r.vehicle_brand} {r.vehicle_model}
                  </div>
                </div>
              ),
            },
            {
              key: 'assignee_name',
              header: '负责人',
              render: (r) => r.assignee_name ?? '—',
            },
            {
              key: 'status',
              header: '状态',
              render: (r) => (
                <Badge className={workOrderStatusColor[r.status]}>
                  {workOrderStatusLabel[r.status]}
                </Badge>
              ),
            },
            {
              key: 'created_at',
              header: '创建时间',
              render: (r) => formatDate(r.created_at),
            },
          ]}
        />
      </section>
    </div>
  );
}
