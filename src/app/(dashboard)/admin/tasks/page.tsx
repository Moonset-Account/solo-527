'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ListTodo,
  Search,
  Filter,
  Plus,
  Bell,
  UserRound,
  Eye,
  RefreshCw,
  Loader2,
  Inbox,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import {
  cn,
  STATUS_LABEL,
  PRIORITY_LABEL,
  formatDate,
  formatDateTime,
  countdownText,
} from '@/lib/utils';
import type {
  TaskStatus,
  TaskPriority,
  TaskListItem,
} from '@/types';

interface SimpleUser {
  id: string;
  name: string;
  department?: string | null;
  role: string;
}

const STATUSES: (TaskStatus | 'ALL')[] = [
  'ALL',
  'PENDING_CLAIM',
  'IN_PROGRESS',
  'DELAYED',
  'COMPLETED',
  'CANCELLED',
];

const PRIORITIES: (TaskPriority | 'ALL')[] = [
  'ALL',
  'URGENT',
  'HIGH',
  'MEDIUM',
  'LOW',
];

export default function AdminTasksPage() {
  const { user } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [priority, setPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [assigneeId, setAssigneeId] = useState<string>('ALL');
  const [keyword, setKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reassignOpen, setReassignOpen] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-tasks', { status, priority, assigneeId, keyword }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== 'ALL') params.set('status', status);
      if (priority !== 'ALL') params.set('priority', priority);
      if (assigneeId !== 'ALL') params.set('assigneeId', assigneeId);
      if (keyword) params.set('keyword', keyword);
      params.set('pageSize', '50');
      const res = await fetch(`/api/tasks?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { total: number; items: TaskListItem[] };
    },
    enabled: !!user,
  });

  const { data: users } = useQuery({
    queryKey: ['simple-users'],
    queryFn: async () => {
      const res = await fetch('/api/users?simple=true');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as SimpleUser[];
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    const items = data?.items || [];
    if (!keyword) return items;
    const kw = keyword.toLowerCase();
    return items.filter(
      (t) =>
        t.title.toLowerCase().includes(kw) ||
        (t.description?.toLowerCase() || '').includes(kw)
    );
  }, [data, keyword]);

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const remindMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}/remind`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      toast('催办已发送', 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const reassignMutation = useMutation({
    mutationFn: async ({
      id,
      assigneeId,
    }: {
      id: string;
      assigneeId: string | null;
    }) => {
      const res = await fetch(`/api/tasks/${id}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      toast('责任人已变更', 'success');
      setReassignOpen(null);
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const batchRemind = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast('请先勾选要催办的事项', 'info');
      return;
    }
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/tasks/${id}/remind`, { method: 'POST' }).then((r) =>
          r.json()
        )
      )
    );
    const success = results.filter((r) => r.status === 'fulfilled').length;
    queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
    toast(`已向 ${success}/${ids.length} 条事项发送催办`, success > 0 ? 'success' : 'error');
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-primary" />
            事项管理
            {data?.total !== undefined && (
              <span className="text-sm font-normal text-slate-400 ml-2">
                共 {data.total} 项
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            管理所有周会待办事项，派发、催办、变更责任人
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="btn-secondary !px-3 !py-2"
            title="刷新"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
          <a href="/admin/tasks/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            新建待办
          </a>
        </div>
      </div>

      <div className="card-base p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索标题、描述..."
              className="input-base pl-10"
            />
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="w-4 h-4" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="input-base !w-auto min-w-[120px] !py-2"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? '全部状态' : STATUS_LABEL[s]?.label || s}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="input-base !w-auto min-w-[120px] !py-2"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p === 'ALL' ? '全部优先级' : PRIORITY_LABEL[p]?.label + '优先级' || p}
                </option>
              ))}
            </select>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="input-base !w-auto min-w-[140px] !py-2"
            >
              <option value="ALL">全部责任人</option>
              <option value="unassigned">待认领</option>
              {(users || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-sm text-slate-500">
            已选择{' '}
            <span className="font-semibold text-primary">{selectedIds.size}</span>{' '}
            项
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={batchRemind}
              disabled={selectedIds.size === 0}
              className="btn-accent !py-1.5 text-xs"
            >
              <Bell className="w-3.5 h-3.5" />
              批量催办
            </button>
          </div>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">加载中...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">
                当前条件下暂无事项
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                请尝试调整筛选条件，或点击右上角创建新的待办。
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-[44px_1.4fr_90px_100px_110px_140px_180px_70px_140px_140px] gap-3 px-5 py-3 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[1200px]">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 cursor-pointer"
                  />
                </div>
                <div>标题</div>
                <div>状态</div>
                <div>优先级</div>
                <div>责任人</div>
                <div>截止日期</div>
                <div>进度</div>
                <div className="text-center">催办</div>
                <div>创建时间</div>
                <div className="text-right pr-2">操作</div>
              </div>

              {filtered.map((task) => {
                const statusCfg = STATUS_LABEL[task.status];
                const priCfg = PRIORITY_LABEL[task.priority];
                const cd = countdownText(task.dueDate);
                const isDelayed =
                  cd.startsWith('已逾期') || task.status === 'DELAYED';
                return (
                  <div
                    key={task.id}
                    className="grid grid-cols-[44px_1.4fr_90px_100px_110px_140px_180px_70px_140px_140px] gap-3 px-5 py-4 items-center hover:bg-slate-50/60 transition-colors text-sm min-w-[1200px] relative"
                  >
                    <div>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 cursor-pointer"
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="font-medium text-slate-900 truncate hover:text-primary cursor-pointer"
                        title={task.title}
                      >
                        {task.title}
                      </div>
                      {task.description && (
                        <div
                          className="text-xs text-slate-400 mt-1 truncate"
                          title={task.description}
                        >
                          {task.description}
                        </div>
                      )}
                    </div>
                    <div>
                      <span
                        className={cn('badge', statusCfg?.className)}
                      >
                        {statusCfg?.label || task.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn('status-dot', priCfg?.dot)}
                      />
                      <span className="text-slate-700">
                        {priCfg?.label || task.priority}
                      </span>
                    </div>
                    <div className="relative">
                      {task.assignee ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-primary/80 to-accent text-white text-[10px] font-bold flex items-center justify-center">
                            {task.assignee.name.slice(0, 1)}
                          </div>
                          <span className="text-slate-700 truncate">
                            {task.assignee.name}
                          </span>
                        </div>
                      ) : (
                        <span className="badge !bg-slate-50 !text-slate-500 !border-slate-200">
                          待认领
                        </span>
                      )}
                    </div>
                    <div className="text-xs">
                      <div
                        className={cn(
                          'font-mono tabular-nums',
                          isDelayed ? 'text-danger' : 'text-slate-700'
                        )}
                      >
                        {formatDate(task.dueDate)}
                      </div>
                      <div
                        className={cn(
                          'mt-0.5',
                          isDelayed ? 'text-danger' : 'text-slate-400'
                        )}
                      >
                        {cd}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex-1 progress-track">
                          <div
                            className={cn(
                              'progress-fill',
                              task.progress >= 100
                                ? 'bg-emerald-500'
                                : priCfg?.bar || 'bg-primary'
                            )}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0 w-10 text-right">
                          {task.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="text-center font-mono tabular-nums text-slate-600">
                      {task.remindCount}
                    </div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums">
                      {formatDateTime(task.createdAt)}
                    </div>
                    <div className="flex items-center justify-end gap-1 relative">
                      <button
                        onClick={() => remindMutation.mutate(task.id)}
                        disabled={remindMutation.isPending}
                        className="btn-ghost !p-1.5 text-amber-600 hover:!bg-amber-50"
                        title="催办"
                      >
                        <Bell className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setReassignOpen(
                              reassignOpen === task.id ? null : task.id
                            )
                          }
                          className="btn-ghost !p-1.5 text-primary hover:!bg-primary/5"
                          title="变更责任人"
                        >
                          <UserRound className="w-4 h-4" />
                        </button>
                        {reassignOpen === task.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setReassignOpen(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-hover z-20 py-1.5 max-h-64 overflow-y-auto scrollbar-thin">
                              <button
                                onClick={() =>
                                  reassignMutation.mutate({
                                    id: task.id,
                                    assigneeId: null,
                                  })
                                }
                                className="w-full px-3.5 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-between"
                              >
                                <span>待认领</span>
                                {!task.assignee && (
                                  <Check className="w-4 h-4 text-primary" />
                                )}
                              </button>
                              {(users || []).map((u) => (
                                <button
                                  key={u.id}
                                  onClick={() =>
                                    reassignMutation.mutate({
                                      id: task.id,
                                      assigneeId: u.id,
                                    })
                                  }
                                  className="w-full px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                                >
                                  <span>{u.name}</span>
                                  {task.assignee?.id === u.id && (
                                    <Check className="w-4 h-4 text-primary" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        className="btn-ghost !p-1.5 text-slate-500 hover:!bg-slate-100"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
