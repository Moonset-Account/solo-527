'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollText,
  Search,
  Filter,
  CalendarRange,
  UserRound,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Loader2,
  Inbox,
  ChevronRight,
  Globe2,
} from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';
import {
  cn,
  ACTION_LABEL,
  formatDateTime,
} from '@/lib/utils';
import type { LogAction } from '@/types';

interface LogItem {
  id: string;
  action: LogAction;
  createdAt: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  operator: { id: string; name: string; role: string };
  task?: { id: string; title: string } | null;
}

interface PagedData {
  total: number;
  page: number;
  pageSize: number;
  items: LogItem[];
}

const ALL_ACTIONS: LogAction[] = [
  'TASK_CREATED',
  'TASK_CLAIMED',
  'TASK_COMPLETED',
  'TASK_CANCELLED',
  'PROGRESS_UPDATED',
  'DELAY_RECORDED',
  'ASSIGNEE_CHANGED',
  'STATUS_CHANGED',
  'REMINDER_SENT',
  'REMINDER_SCHEDULED',
  'USER_CREATED',
  'USER_ROLE_CHANGED',
];

function diffSummary(
  oldVal?: Record<string, unknown> | null,
  newVal?: Record<string, unknown> | null
): { label: string; from: string; to: string }[] {
  const keys = new Set<string>();
  Object.keys(oldVal || {}).forEach((k) => keys.add(k));
  Object.keys(newVal || {}).forEach((k) => keys.add(k));
  const result: { label: string; from: string; to: string }[] = [];
  keys.forEach((k) => {
    const from = JSON.stringify((oldVal || {})[k]);
    const to = JSON.stringify((newVal || {})[k]);
    if (from !== to) {
      result.push({
        label: k,
        from: from === undefined ? '-' : from.replace(/^"|"$/g, ''),
        to: to === undefined ? '-' : to.replace(/^"|"$/g, ''),
      });
    }
  });
  return result;
}

export default function LogsPage() {
  const { user } = useSession();

  const [action, setAction] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [operator, setOperator] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['logs', { action, fromDate, toDate, operator, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (action !== 'ALL') params.set('action', action);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (operator) params.set('operatorId', operator);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      const res = await fetch(`/api/logs?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as PagedData;
    },
    enabled: !!user,
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const simpleOperatorOptions = useMemo(() => {
    const map = new Map<string, string>();
    (data?.items || []).forEach((l) => {
      if (l.operator?.id && l.operator?.name) {
        map.set(l.operator.id, l.operator.name);
      }
    });
    return Array.from(map.entries());
  }, [data?.items]);

  const goPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-primary" />
            日志审计
            {total > 0 && (
              <span className="text-sm font-normal text-slate-400 ml-2">
                共 {total.toLocaleString()} 条
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            所有待办和用户相关操作的完整审计追踪
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary !px-3 !py-2"
          title="刷新"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      <div className="card-base p-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 mb-0.5" />
          <div>
            <div className="text-[11px] text-slate-400 mb-1">操作类型</div>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="input-base !py-2 !text-xs !w-auto min-w-[160px]"
            >
              <option value="ALL">全部类型</option>
              {ALL_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABEL[a]?.label || a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-slate-400 mb-0.5" />
          <div>
            <div className="text-[11px] text-slate-400 mb-1">日期范围</div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="input-base !py-2 !text-xs"
              />
              <span className="text-slate-400 text-xs">至</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="input-base !py-2 !text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 mb-0.5" />
          <div>
            <div className="text-[11px] text-slate-400 mb-1">操作人</div>
            <div className="relative">
              <input
                list="operators-datalist"
                value={operator}
                onChange={(e) => {
                  setOperator(e.target.value);
                  setPage(1);
                }}
                placeholder="搜索操作人 ID 或姓名"
                className="input-base !py-2 !text-xs !w-auto min-w-[220px] pl-9"
              />
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <datalist id="operators-datalist">
                {simpleOperatorOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {(fromDate || toDate || action !== 'ALL' || operator) && (
          <button
            onClick={() => {
              setAction('ALL');
              setFromDate('');
              setToDate('');
              setOperator('');
              setPage(1);
            }}
            className="btn-secondary !py-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            清除筛选
          </button>
        )}
      </div>

      <div className="card-base overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">加载中...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              暂无日志记录
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              当前筛选条件下没有操作日志，请尝试调整条件。
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="divide-y divide-slate-100 min-w-[1200px]">
                <div className="grid grid-cols-[170px_130px_1.4fr_120px_2.4fr_130px] gap-3 px-5 py-3 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <div>时间</div>
                  <div>操作类型</div>
                  <div>关联事项</div>
                  <div>操作人</div>
                  <div>变更内容</div>
                  <div className="flex items-center gap-1">
                    <Globe2 className="w-3.5 h-3.5" />
                    IP 地址
                  </div>
                </div>

                {items.map((log) => {
                  const actCfg = ACTION_LABEL[log.action] || {
                    label: log.action,
                    className: 'bg-slate-50 text-slate-600',
                  };
                  const diffs = diffSummary(log.oldValue, log.newValue);
                  return (
                    <div
                      key={log.id}
                      className="grid grid-cols-[170px_130px_1.4fr_120px_2.4fr_130px] gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors text-sm"
                    >
                      <div className="text-xs text-slate-500 font-mono tabular-nums leading-relaxed">
                        {formatDateTime(log.createdAt)}
                      </div>
                      <div>
                        <span
                          className={cn(
                            'badge !text-[11px] whitespace-nowrap',
                            actCfg.className
                          )}
                        >
                          {actCfg.label}
                        </span>
                      </div>
                      <div className="min-w-0">
                        {log.task ? (
                          <a
                            href="#"
                            className="text-primary hover:underline truncate block"
                            title={log.task.title}
                          >
                            <ChevronRight className="w-3.5 h-3.5 inline -mt-0.5 mr-0.5 text-primary/60" />
                            {log.task.title}
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-primary/70 to-accent text-white text-[10px] font-bold flex items-center justify-center">
                            {log.operator?.name?.slice(0, 1) || '?'}
                          </div>
                          <span className="text-slate-700 truncate text-sm">
                            {log.operator?.name || '-'}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        {diffs.length === 0 ? (
                          <span className="text-slate-400 text-xs">—</span>
                        ) : (
                          <div className="space-y-1 max-w-full">
                            {diffs.slice(0, 3).map((d, idx) => (
                              <div
                                key={idx}
                                className="text-xs flex flex-wrap items-center gap-1 min-w-0"
                              >
                                <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium shrink-0">
                                  {d.label}
                                </span>
                                <span
                                  className="text-rose-600 truncate max-w-[140px]"
                                  title={d.from}
                                >
                                  {d.from}
                                </span>
                                <span className="text-slate-300 shrink-0">
                                  →
                                </span>
                                <span
                                  className="text-emerald-600 truncate max-w-[140px] font-medium"
                                  title={d.to}
                                >
                                  {d.to}
                                </span>
                              </div>
                            ))}
                            {diffs.length > 3 && (
                              <div className="text-xs text-slate-400">
                                还有 {diffs.length - 3} 项变更...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono tabular-nums truncate">
                        {log.ipAddress || '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40">
                <div className="text-xs text-slate-500">
                  第 {page} / {totalPages} 页，每页 {pageSize} 条
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goPage(page - 1)}
                    disabled={page <= 1}
                    className="btn-ghost !p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number;
                    const half = 2;
                    if (totalPages <= 5) {
                      p = i + 1;
                    } else if (page <= half + 1) {
                      p = i + 1;
                    } else if (page >= totalPages - half) {
                      p = totalPages - 4 + i;
                    } else {
                      p = page - half + i;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => goPage(p)}
                        className={cn(
                          'min-w-[32px] h-8 rounded-pill text-xs font-medium transition-colors',
                          page === p
                            ? 'bg-primary text-white shadow-soft'
                            : 'text-slate-600 hover:bg-slate-100'
                        )}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => goPage(page + 1)}
                    disabled={page >= totalPages}
                    className="btn-ghost !p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
