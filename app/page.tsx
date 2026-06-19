'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  Bookmark,
  Bell,
  MapPin,
  User,
  Send,
} from 'lucide-react';
import { Card, Button, StatusBadge, DataTable } from '@/components/ui';
import { cn, formatCurrency, formatDate, daysFromToday } from '@/lib/utils';
import {
  mockProjects,
  mockProjectNodes,
  mockSavedFilters,
} from '@/lib/mockData';
import type { Project, ProjectNode, SavedFilter } from '@/lib/types';
import { useAppStore } from '@/lib/store';

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  tone,
}: {
  icon: any;
  label: string;
  value: string | number;
  delta?: string;
  tone: 'brand' | 'warn' | 'danger' | 'zinc';
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700 border-brand-100',
    warn: 'bg-warn-50 text-warn-600 border-warn-100',
    danger: 'bg-danger-50 text-danger-600 border-danger-100',
    zinc: 'bg-zinc-50 text-zinc-700 border-zinc-100',
  };
  return (
    <div className="rounded border border-zinc-200 bg-white p-5 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500">{label}</p>
          <p className="mt-2 font-serif text-3xl font-semibold text-zinc-900">{value}</p>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded border',
            tones[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta && (
        <div className="mt-3 border-t border-zinc-100 pt-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1 text-brand-700">
            <TrendingUp className="h-3 w-3" />
            {delta}
          </span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { savedFilters, addSavedFilter, removeSavedFilter, setDefaultFilter, currentUser } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<string | null>(
    savedFilters.find((f) => f.page_key === 'project_list' && f.is_default)?.id ?? null
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');

  const myPageFilters = savedFilters.filter((f) => f.page_key === 'project_list');

  const projects = useMemo(() => {
    let list = mockProjects;
    if (activeFilter) {
      const f = myPageFilters.find((x) => x.id === activeFilter);
      if (f) {
        const params = f.filter_params as any;
        if (params.status && params.status !== 'all') {
          list = list.filter((p) => p.status === params.status);
        }
        if (params.project_manager_id) {
          list = list.filter((p) => p.project_manager_id === params.project_manager_id);
        }
      }
    }
    if (filterStatus !== 'all') {
      list = list.filter((p) => p.status === filterStatus);
    }
    return list;
  }, [activeFilter, filterStatus, myPageFilters]);

  const delayedNodes = useMemo(
    () =>
      mockProjectNodes
        .filter((n) => n.status === 'delayed' || (n.planned_end_date && n.status !== 'completed' && daysFromToday(n.planned_end_date) < 0))
        .sort((a, b) => b.delay_days - a.delay_days),
    []
  );

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) return;
    addSavedFilter({
      page_key: 'project_list',
      name: newFilterName.trim(),
      filter_params: { status: filterStatus },
      sort_params: { created_at: 'desc' },
      is_default: false,
    });
    setNewFilterName('');
    setShowSaveFilter(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="在建项目"
          value={mockProjects.filter((p) => p.status === 'in_progress').length}
          delta="较上月 +1"
          tone="brand"
        />
        <StatCard
          icon={AlertTriangle}
          label="延期节点"
          value={delayedNodes.length}
          delta={`平均延期 ${delayedNodes.length ? (delayedNodes.reduce((s, n) => s + n.delay_days, 0) / delayedNodes.length).toFixed(1) : 0} 天`}
          tone="danger"
        />
        <StatCard
          icon={CheckCircle2}
          label="本月完工"
          value={1}
          delta="预算执行率 102.3%"
          tone="brand"
        />
        <StatCard
          icon={TrendingUp}
          label="整体预算执行率"
          value={
            (
              (mockProjects.reduce((s, p) => s + p.budget_used, 0) /
                Math.max(1, mockProjects.reduce((s, p) => s + p.budget_total, 0))) *
              100
            ).toFixed(1) + '%'
          }
          delta="超支 1 个项目"
          tone="warn"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <span className="font-serif text-sm font-semibold text-zinc-900">项目列表</span>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <Button variant="ghost" size="sm">
                    <Bookmark className="h-3.5 w-3.5" />
                    我的筛选
                    <ChevronRight className="h-3 w-3 -rotate-90" />
                  </Button>
                  <div className="absolute right-0 top-full z-10 mt-1 hidden w-56 rounded border border-zinc-200 bg-white p-1 shadow-lg group-hover:block">
                    {myPageFilters.length === 0 && (
                      <div className="px-3 py-2 text-xs text-zinc-400">暂无保存的筛选</div>
                    )}
                    {myPageFilters.map((f) => (
                      <div
                        key={f.id}
                        className={cn(
                          'flex items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-zinc-50',
                          activeFilter === f.id && 'bg-brand-50 text-brand-700'
                        )}
                      >
                        <button
                          onClick={() => setActiveFilter(f.id)}
                          className="flex-1 text-left flex items-center gap-1.5"
                        >
                          {f.is_default && <span className="text-warn-600">★</span>}
                          {f.name}
                        </button>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDefaultFilter('project_list', f.id);
                            }}
                            className="rounded px-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                            title="设为默认"
                          >
                            ★
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSavedFilter(f.id);
                            }}
                            className="rounded px-1 text-zinc-400 hover:bg-zinc-100 hover:text-danger-600"
                            title="删除"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {showSaveFilter ? (
                  <div className="flex items-center gap-1">
                    <input
                      value={newFilterName}
                      onChange={(e) => setNewFilterName(e.target.value)}
                      placeholder="筛选名称"
                      className="h-7 w-32 rounded border border-zinc-300 px-2 text-xs focus:outline-none focus:border-brand-500"
                      autoFocus
                    />
                    <Button size="sm" variant="primary" onClick={handleSaveFilter}>
                      保存
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowSaveFilter(false)}
                    >
                      取消
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setShowSaveFilter(true)}>
                    <Bookmark className="h-3.5 w-3.5" />
                    保存当前筛选
                  </Button>
                )}
              </div>
            </div>
          }
          className="lg:col-span-2"
        >
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 rounded border border-zinc-200 bg-white px-2 text-sm text-zinc-700 focus:outline-none focus:border-brand-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待启动</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="suspended">已暂停</option>
            </select>
            <span className="text-xs text-zinc-400">共 {projects.length} 个项目</span>
          </div>

          <DataTable<Project>
            data={projects}
            rowKey={(r) => r.id}
            columns={[
              {
                key: 'name',
                title: '项目名称',
                render: (r) => (
                  <div>
                    <Link
                      href={`/projects/${r.id}`}
                      className="font-medium text-zinc-900 hover:text-brand-700 hover:underline"
                    >
                      {r.name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
                      <MapPin className="h-3 w-3" />
                      {r.address}
                    </div>
                  </div>
                ),
              },
              {
                key: 'customer_name',
                title: '客户',
                render: (r) => (
                  <div className="text-xs">
                    <div className="text-zinc-700">{r.customer_name}</div>
                    <div className="text-zinc-400">{r.customer_phone}</div>
                  </div>
                ),
              },
              {
                key: 'project_manager_name',
                title: '项目经理',
                render: (r) => (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                    <User className="h-3 w-3 text-zinc-400" />
                    {r.project_manager_name}
                  </div>
                ),
              },
              {
                key: 'status',
                title: '状态',
                width: '90px',
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: 'budget',
                title: '预算执行',
                render: (r) => {
                  const pct = Math.min(
                    100,
                    Math.round((r.budget_used / Math.max(1, r.budget_total)) * 100)
                  );
                  const overrun = r.budget_used > r.budget_total;
                  return (
                    <div className="min-w-[140px]">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className={cn(overrun ? 'text-danger-600' : 'text-zinc-600')}>
                          {formatCurrency(r.budget_used)}
                        </span>
                        <span className="text-zinc-400">
                          / {formatCurrency(r.budget_total)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            overrun ? 'bg-danger-500' : 'bg-brand-600'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                },
              },
              {
                key: 'delay',
                title: '延期',
                width: '70px',
                render: (r) =>
                  r.delay_days && r.delay_days > 0 ? (
                    <span className="text-xs font-medium text-danger-600">{r.delay_days} 天</span>
                  ) : (
                    <span className="text-xs text-zinc-400">-</span>
                  ),
              },
              {
                key: 'time',
                title: '工期',
                render: (r) => (
                  <div className="text-xs text-zinc-500">
                    <div>{formatDate(r.start_date)}</div>
                    <div>→ {formatDate(r.planned_end_date)}</div>
                  </div>
                ),
              },
            ]}
          />
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 font-serif text-sm font-semibold text-zinc-900">
                <AlertTriangle className="h-4 w-4 text-danger-600" />
                延期预警
              </span>
              <Link
                href="/delays"
                className="text-xs text-brand-700 hover:underline"
              >
                全部处理 →
              </Link>
            </div>
          }
        >
          <ul className="space-y-2">
            {delayedNodes.slice(0, 6).map((n) => (
              <li
                key={n.id}
                className="animate-breath-border rounded border border-zinc-100 bg-danger-50/40 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-zinc-900">{n.name}</div>
                    <div className="mt-0.5 truncate text-xs text-zinc-500">{n.project_name}</div>
                  </div>
                  <span className="whitespace-nowrap rounded bg-danger-100 px-1.5 py-0.5 text-xs font-semibold text-danger-700">
                    延期 {Math.max(n.delay_days, 1)} 天
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-zinc-500">
                    计划：{formatDate(n.planned_end_date)}
                    <span className="mx-1">·</span>
                    负责：{n.assignee_name}
                  </div>
                  <button
                    className="inline-flex items-center gap-1 rounded border border-brand-200 bg-white px-2 py-1 text-xs text-brand-700 hover:bg-brand-50"
                    title="发送提醒"
                  >
                    <Send className="h-3 w-3" />
                    提醒
                  </button>
                </div>
              </li>
            ))}
            {delayedNodes.length === 0 && (
              <li className="py-6 text-center text-sm text-zinc-400">暂无延期节点 🎉</li>
            )}
          </ul>
        </Card>
      </div>

      <Card title="关键节点甘特图">
        <div className="space-y-3">
          {mockProjects
            .filter((p) => p.status === 'in_progress' || p.status === 'pending')
            .map((p) => {
              const nodes = mockProjectNodes.filter((n) => n.project_id === p.id);
              if (nodes.length === 0) return null;
              const minDate = new Date(
                nodes.reduce((m, n) => (n.planned_start_date < m ? n.planned_start_date : m), nodes[0].planned_start_date)
              ).getTime();
              const maxDate = new Date(
                nodes.reduce((m, n) => (n.planned_end_date > m ? n.planned_end_date : m), nodes[0].planned_end_date)
              ).getTime();
              const total = Math.max(1, maxDate - minDate);
              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800">{p.name}</span>
                    <span className="text-zinc-400">
                      {formatDate(nodes[0].planned_start_date)} ~ {formatDate(nodes[nodes.length - 1].planned_end_date)}
                    </span>
                  </div>
                  <div className="relative space-y-1">
                    {nodes.map((n) => {
                      const start = (new Date(n.planned_start_date).getTime() - minDate) / total;
                      const end = (new Date(n.planned_end_date).getTime() - minDate) / total;
                      const width = Math.max(4, end - start) * 100;
                      const colorMap: Record<string, string> = {
                        not_started: 'bg-zinc-300',
                        in_progress: 'bg-brand-600',
                        completed: 'bg-green-500',
                        delayed: 'bg-danger-500',
                      };
                      return (
                        <div key={n.id} className="flex items-center gap-3 h-7">
                          <div className="w-24 flex-shrink-0 truncate text-xs text-zinc-600">{n.name}</div>
                          <div className="relative flex-1 h-5 rounded bg-zinc-100 overflow-hidden">
                            <div
                              className={cn(
                                'absolute top-1/2 h-3 -translate-y-1/2 rounded shadow-sm transition-all',
                                colorMap[n.status],
                                n.status === 'in_progress' && 'animate-pulse-slow'
                              )}
                              style={{ left: `${start * 100}%`, width: `${width}%` }}
                              title={`${n.name} - ${formatDate(n.planned_start_date)} ~ ${formatDate(n.planned_end_date)}`}
                            />
                          </div>
                          <div className="w-16 flex-shrink-0 text-right">
                            <StatusBadge status={n.status} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
  );
}
