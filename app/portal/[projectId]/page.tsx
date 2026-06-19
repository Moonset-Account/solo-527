'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { Card, Button, StatusBadge } from '@/components/ui';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  mockProjects,
  mockProjectNodes,
  mockQuotations,
  mockAddons,
  mockBudgetChangeLogs,
} from '@/lib/mockData';

export default function PortalPage({ params }: { params: { projectId: string } }) {
  const project = mockProjects.find((p) => p.id === params.projectId) ?? mockProjects[0];
  const nodes = mockProjectNodes.filter((n) => n.project_id === project.id);
  const quotations = mockQuotations.filter((q) => q.project_id === project.id);
  const addons = mockAddons.filter((a) => a.project_id === project.id);
  const budgetLogs = mockBudgetChangeLogs.filter((b) => b.project_id === project.id);
  const activeQuotation = quotations[0];

  const [tab, setTab] = useState<'progress' | 'quotation' | 'addons' | 'budget'>('progress');

  const pendingQuotation = quotations.find((q) => q.status === 'pending_confirm');
  const pendingAddons = addons.filter((a) => a.status === 'pending');
  const pendingCount = (pendingQuotation ? 1 : 0) + pendingAddons.length;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-zinc-900">{project.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {project.address}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(project.start_date)} → {formatDate(project.planned_end_date)}
              </span>
              <StatusBadge status={project.status} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-xs text-zinc-500">合同金额</div>
              <div className="mt-1 font-serif text-lg font-semibold text-zinc-900">
                {formatCurrency(project.budget_total)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">已支出</div>
              <div className="mt-1 font-serif text-lg font-semibold text-brand-700">
                {formatCurrency(project.budget_used)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">整改进度</div>
              <div className="mt-1 font-serif text-lg font-semibold text-zinc-900">
                {Math.round(
                  (nodes.filter((n) => n.status === 'completed').length / Math.max(1, nodes.length)) * 100
                )}
                %
              </div>
            </div>
          </div>
        </div>
      </Card>

      {pendingCount > 0 && (
        <div className="flex items-center justify-between rounded border border-warn-200 bg-warn-50 px-4 py-3">
          <div className="flex items-center gap-2 text-warn-700">
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">
              您有 {pendingCount} 项待确认事项（
              {pendingQuotation && '报价 1 项'}
              {pendingQuotation && pendingAddons.length > 0 && '，'}
              {pendingAddons.length > 0 && `增项 ${pendingAddons.length} 项`}
              ）
            </span>
          </div>
          <Button
            size="sm"
            variant="warn"
            onClick={() => setTab(pendingQuotation ? 'quotation' : 'addons')}
          >
            立即处理
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-6 border-b border-zinc-200">
        {(
          [
            { k: 'progress' as const, label: '施工进度', badge: undefined as number | undefined },
            { k: 'quotation' as const, label: '报价确认', badge: pendingQuotation ? 1 : undefined },
            { k: 'addons' as const, label: '增项管理', badge: pendingAddons.length || undefined },
            { k: 'budget' as const, label: '预算明细', badge: undefined as number | undefined },
          ]
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              'relative flex items-center gap-1.5 border-b-2 pb-3 pt-2 text-sm font-medium transition-colors',
              tab === t.k
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            )}
          >
            {t.label}
            {t.badge && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-semibold text-white">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'progress' && (
        <Card>
          <div className="space-y-1">
            {nodes.map((n, i) => {
              const isLast = i === nodes.length - 1;
              const colorMap: Record<string, { dot: string; line: string; text: string }> = {
                completed: { dot: 'bg-green-500', line: 'bg-green-200', text: 'text-green-700' },
                in_progress: { dot: 'bg-brand-600 animate-pulse-slow', line: 'bg-brand-200', text: 'text-brand-700' },
                delayed: { dot: 'bg-danger-500', line: 'bg-danger-200', text: 'text-danger-700' },
                not_started: { dot: 'bg-zinc-300', line: 'bg-zinc-100', text: 'text-zinc-500' },
              };
              const c = colorMap[n.status];
              return (
                <div key={n.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn('mt-1 h-3 w-3 rounded-full', c.dot)} />
                    {!isLast && <div className={cn('mt-1 w-0.5 flex-1 min-h-[52px]', c.line)} />}
                  </div>
                  <div className="flex-1 pb-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">{n.name}</span>
                      <StatusBadge status={n.status} />
                      {n.delay_days > 0 && (
                        <span className="text-xs font-medium text-danger-600">
                          延期 {n.delay_days} 天
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      计划 {formatDate(n.planned_start_date)} ~ {formatDate(n.planned_end_date)}
                      {n.actual_start_date && (
                        <>
                          {' · '}实际 {formatDate(n.actual_start_date)}
                          {n.actual_end_date ? ` ~ ${formatDate(n.actual_end_date)}` : ''}
                        </>
                      )}
                    </div>
                    {n.delay_reason && (
                      <div className="mt-1.5 rounded bg-danger-50 px-2 py-1 text-xs text-danger-700">
                        延期原因：{n.delay_reason}
                        {n.remark && ` · ${n.remark}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'quotation' && activeQuotation && (
        <div className="space-y-4">
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-sm font-semibold text-zinc-900">
                    报价单 V{activeQuotation.version}
                  </span>
                  <StatusBadge status={activeQuotation.status} />
                </div>
                <div className="text-sm text-zinc-500">
                  总价：
                  <span className="font-serif text-lg font-semibold text-brand-700 ml-1">
                    {formatCurrency(activeQuotation.total_amount)}
                  </span>
                </div>
              </div>
            }
          >
            <div className="divide-y divide-zinc-100">
              {Object.entries(
                activeQuotation.items.reduce<Record<string, typeof activeQuotation.items>>((acc, it) => {
                  (acc[it.category] ||= []).push(it);
                  return acc;
                }, {})
              ).map(([cat, items]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between bg-zinc-50/60 px-3 py-2 text-xs">
                    <span className="font-medium text-zinc-700">{cat}</span>
                    <span className="text-zinc-500">
                      {items.length} 项 · 小计 {formatCurrency(items.reduce((s, i) => s + i.subtotal, 0))}
                    </span>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500">
                        <th className="px-3 py-2 font-normal">项目</th>
                        <th className="px-3 py-2 font-normal">单位</th>
                        <th className="px-3 py-2 font-normal">数量</th>
                        <th className="px-3 py-2 font-normal">单价</th>
                        <th className="px-3 py-2 text-right font-normal">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.id} className="border-b border-zinc-50">
                          <td className="px-3 py-2 text-zinc-800">{it.name}</td>
                          <td className="px-3 py-2 text-zinc-500">{it.unit}</td>
                          <td className="px-3 py-2 text-zinc-700">{it.quantity}</td>
                          <td className="px-3 py-2 text-zinc-700">{formatCurrency(it.unit_price)}</td>
                          <td className="px-3 py-2 text-right font-medium text-zinc-900">
                            {formatCurrency(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 -mx-5 -mb-5 mt-4 flex items-center justify-between border-t border-zinc-200 bg-white px-5 py-3">
              <div className="text-sm text-zinc-500">
                合计：
                <span className="ml-2 font-serif text-2xl font-semibold text-brand-700">
                  {formatCurrency(activeQuotation.total_amount)}
                </span>
              </div>
              {activeQuotation.status === 'pending_confirm' && (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="lg">
                    <XCircle className="h-4 w-4" />
                    驳回报价
                  </Button>
                  <Button variant="primary" size="lg">
                    <CheckCircle2 className="h-4 w-4" />
                    确认报价
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === 'addons' && (
        <Card title="增项列表">
          <div className="space-y-3">
            {addons.length === 0 && (
              <div className="py-10 text-center text-sm text-zinc-400">暂无增项记录</div>
            )}
            {addons.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-4 rounded border border-zinc-200 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">{a.name}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{a.description}</p>
                  <div className="mt-1.5 text-xs text-zinc-400">
                    发起人：{a.requested_by_name} · {formatDate(a.created_at)}
                    {a.confirmed_at && ` · 确认时间 ${formatDate(a.confirmed_at)}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-lg font-semibold text-brand-700">
                    +{formatCurrency(a.amount)}
                  </div>
                  {a.status === 'pending' && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="secondary">
                        驳回
                      </Button>
                      <Button size="sm" variant="primary">
                        确认
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'budget' && (
        <Card title="预算变更历史">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
                <th className="px-3 py-2 font-normal">时间</th>
                <th className="px-3 py-2 font-normal">类型</th>
                <th className="px-3 py-2 font-normal">说明</th>
                <th className="px-3 py-2 text-right font-normal">变动金额</th>
                <th className="px-3 py-2 text-right font-normal">变更后预算</th>
                <th className="px-3 py-2 font-normal">操作人</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {budgetLogs.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2.5 text-zinc-600">{formatDate(l.created_at)}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        'rounded px-2 py-0.5 text-xs',
                        l.change_type === 'quotation' && 'bg-brand-50 text-brand-700',
                        l.change_type === 'addon' && 'bg-green-50 text-green-700',
                        l.change_type === 'adjustment' && 'bg-warn-50 text-warn-600'
                      )}
                    >
                      {l.change_type === 'quotation' ? '报价' : l.change_type === 'addon' ? '增项' : '调价'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-700">{l.reason}</td>
                  <td
                    className={cn(
                      'px-3 py-2.5 text-right font-medium',
                      l.change_amount >= 0 ? 'text-brand-700' : 'text-danger-600'
                    )}
                  >
                    {l.change_amount >= 0 ? '+' : ''}
                    {formatCurrency(l.change_amount)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-zinc-900">{formatCurrency(l.after_budget)}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{l.operator_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
