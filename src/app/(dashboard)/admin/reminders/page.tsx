'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BellRing,
  AlertCircle,
  Clock,
  CalendarClock,
  Settings2,
  Mail,
  MessageSquare,
  Check,
  Loader2,
  RefreshCw,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Play,
  Zap,
  DatabaseZap,
  Power,
  X,
  Save,
  CalendarDays,
  CalendarRange,
  Hash,
  Users,
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
import type { TaskListItem } from '@/types';

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CRON' | 'ONCE';

interface ReminderRuleItem {
  id: string;
  name: string;
  description?: string | null;
  filterStatus?: string | null;
  filterPriority?: string | null;
  filterAssigneeIds?: string | null;
  frequency: Frequency;
  cronExpr?: string | null;
  runDayOfWeek?: number | null;
  runDayOfMonth?: number | null;
  runTime: string;
  channel: string;
  content: string;
  enabled: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  creatorId: string;
  creator?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface RuleFormState {
  name: string;
  description: string;
  filterStatus: string;
  filterPriority: string;
  filterAssigneeIds: string[];
  frequency: Frequency;
  cronExpr: string;
  runDayOfWeek: number;
  runDayOfMonth: number;
  runTime: string;
  channel: string;
  content: string;
  enabled: boolean;
  runOnceAt: string;
}

const EMPTY_FORM: RuleFormState = {
  name: '',
  description: '',
  filterStatus: 'PENDING_CLAIM,IN_PROGRESS,DELAYED',
  filterPriority: '',
  filterAssigneeIds: [],
  frequency: 'DAILY',
  cronExpr: '',
  runDayOfWeek: 1,
  runDayOfMonth: 1,
  runTime: '09:30',
  channel: 'IN_APP',
  content: '【日程提醒】您负责的事项「{{title}}」请尽快处理并更新进度（{{date}}）。',
  enabled: true,
  runOnceAt: '',
};

const FREQUENCY_LABEL: Record<Frequency, string> = {
  DAILY: '每日',
  WEEKLY: '每周',
  MONTHLY: '每月',
  CRON: 'Cron 表达式',
  ONCE: '单次',
};

const WEEKDAY_OPTIONS = [
  { v: 0, label: '周日' },
  { v: 1, label: '周一' },
  { v: 2, label: '周二' },
  { v: 3, label: '周三' },
  { v: 4, label: '周四' },
  { v: 5, label: '周五' },
  { v: 6, label: '周六' },
];

export default function RemindersPage() {
  const { user } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleFormState>(EMPTY_FORM);

  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['reminder-tasks'],
    queryFn: async () => {
      const statuses = ['PENDING_CLAIM', 'IN_PROGRESS', 'DELAYED'];
      const results = await Promise.all(
        statuses.map((s) =>
          fetch(`/api/tasks?status=${s}&pageSize=100`).then((r) => r.json())
        )
      );
      const all: TaskListItem[] = [];
      results.forEach((r) => {
        if (r.success) all.push(...(r.data?.items || []));
      });
      const map = new Map<string, TaskListItem>();
      all.forEach((t) => map.set(t.id, t));
      const unique = Array.from(map.values());
      const filtered = unique.filter((t) => {
        if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
        const days = daysUntilLocal(t.dueDate);
        return days <= 3 || t.status === 'DELAYED';
      });
      return filtered.sort((a, b) => {
        const da = daysUntilLocal(a.dueDate);
        const db = daysUntilLocal(b.dueDate);
        return da - db;
      });
    },
    enabled: !!user,
  });

  const { data: rulesData, isLoading: rulesLoading, refetch: refetchRules } = useQuery({
    queryKey: ['reminder-rules'],
    queryFn: async () => {
      const res = await fetch('/api/reminder-rules?pageSize=100');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { total: number; items: ReminderRuleItem[] };
    },
    enabled: !!user,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-simple'],
    queryFn: async () => {
      const res = await fetch('/api/users?simple=true');
      const json = await res.json();
      if (!json.success) return [];
      return (json.data?.items || json.data || []) as Array<{
        id: string;
        name: string;
        department?: string;
      }>;
    },
    enabled: !!user,
  });

  const remindMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}/remind`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const createRuleMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/reminder-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
      setModalOpen(false);
      setEditingId(null);
      toast('规则已创建', 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/reminder-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
      setModalOpen(false);
      setEditingId(null);
      toast('规则已更新', 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reminder-rules/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
      toast('规则已删除', 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/reminder-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const triggerRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reminder-rules/${id}/trigger`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { triggered: number; matchedTasks: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
      queryClient.invalidateQueries({ queryKey: ['reminder-tasks'] });
      toast(`手动触发完成：匹配 ${data.matchedTasks} 事项，发送 ${data.triggered} 条催办`, 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/reminder-rules/dispatch', { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { dispatched: number; totalTriggered: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
      queryClient.invalidateQueries({ queryKey: ['reminder-tasks'] });
      toast(
        `调度完成：扫描 ${data.dispatched} 条到期规则，发送 ${data.totalTriggered} 条催办`,
        'success'
      );
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const resyncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/reminder-rules/resync', { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { synced: number };
    },
    onSuccess: (data) => {
      toast(`已将 ${data.synced} 条启用规则同步至 Redis 调度队列`, 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const tasksArray = tasks || [];
  const rules = rulesData?.items || [];

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tasksArray.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tasksArray.map((t) => t.id)));
    }
  };

  const remindOne = async (id: string) => {
    try {
      await remindMutation.mutateAsync(id);
      toast('催办已发送', 'success');
    } catch {
      // handled in onError
    }
  };

  const batchRemind = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast('请先勾选要催办的事项', 'info');
      return;
    }
    const results = await Promise.allSettled(
      ids.map((id) => remindMutation.mutateAsync(id))
    );
    const success = results.filter((r) => r.status === 'fulfilled').length;
    toast(`已向 ${success}/${ids.length} 条事项发送催办`, success > 0 ? 'success' : 'error');
    setSelectedIds(new Set());
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (rule: ReminderRuleItem) => {
    setEditingId(rule.id);
    let assigneeIds: string[] = [];
    if (rule.filterAssigneeIds) {
      try {
        assigneeIds = JSON.parse(rule.filterAssigneeIds);
      } catch {
        assigneeIds = [];
      }
    }
    setForm({
      name: rule.name,
      description: rule.description || '',
      filterStatus: rule.filterStatus || '',
      filterPriority: rule.filterPriority || '',
      filterAssigneeIds: assigneeIds,
      frequency: rule.frequency,
      cronExpr: rule.cronExpr || '',
      runDayOfWeek: rule.runDayOfWeek ?? 1,
      runDayOfMonth: rule.runDayOfMonth ?? 1,
      runTime: rule.runTime,
      channel: rule.channel,
      content: rule.content,
      enabled: rule.enabled,
      runOnceAt: rule.nextRunAt ? new Date(rule.nextRunAt).toISOString().slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      toast('请填写规则名称', 'error');
      return;
    }
    if (!form.runTime) {
      toast('请设置提醒时间', 'error');
      return;
    }
    if (!form.content.trim()) {
      toast('请填写催办文案', 'error');
      return;
    }
    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      filterStatus: form.filterStatus.trim() || undefined,
      filterPriority: form.filterPriority.trim() || undefined,
      filterAssigneeIds: form.filterAssigneeIds.length > 0 ? form.filterAssigneeIds : undefined,
      frequency: form.frequency,
      cronExpr: form.cronExpr.trim() || undefined,
      runDayOfWeek: form.frequency === 'WEEKLY' ? form.runDayOfWeek : undefined,
      runDayOfMonth: form.frequency === 'MONTHLY' ? form.runDayOfMonth : undefined,
      runTime: form.runTime,
      channel: form.channel || 'IN_APP',
      content: form.content,
      enabled: form.enabled,
    };
    if (form.frequency === 'ONCE' && form.runOnceAt) {
      payload.runOnceAt = form.runOnceAt;
    }
    if (editingId) {
      await updateRuleMutation.mutateAsync({ id: editingId, payload });
    } else {
      await createRuleMutation.mutateAsync(payload);
    }
  };

  const toggleAssignee = (userId: string) => {
    const next = new Set(form.filterAssigneeIds);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setForm({ ...form, filterAssigneeIds: Array.from(next) });
  };

  const allSelected = tasksArray.length > 0 && selectedIds.size === tasksArray.length;

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BellRing className="w-6 h-6 text-accent" />
            催办提醒中心
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            快速处理临近截止或已逾期的事项，配置并调度自动提醒规则
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchTasks();
              refetchRules();
            }}
            className="btn-secondary !px-3 !py-2"
            title="刷新"
          >
            <RefreshCw
              className={cn(
                'w-4 h-4',
                (tasksLoading || rulesLoading) && 'animate-spin'
              )}
            />
          </button>
          <button
            onClick={() => dispatchMutation.mutate()}
            disabled={dispatchMutation.isPending}
            className="btn-secondary"
            title="立即扫描 Redis 中队列到期的规则并执行"
          >
            <Zap className={cn('w-4 h-4', dispatchMutation.isPending && 'animate-spin')} />
            调度到期规则
          </button>
          <button
            onClick={() => resyncMutation.mutate()}
            disabled={resyncMutation.isPending}
            className="btn-secondary"
            title="全量重写 Redis 调度 ZSet"
          >
            <DatabaseZap className={cn('w-4 h-4', resyncMutation.isPending && 'animate-spin')} />
            同步 Redis
          </button>
        </div>
      </div>

      {/* 待催办事项清单 */}
      <div className="card-base overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-50/50 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                待催办事项清单
                <span className="badge !text-[11px] !bg-amber-50 !text-amber-700 !border-amber-200">
                  {tasksArray.length} 条待处理
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                状态≠已完成，且截止日期已过或 3 天内到期的事项
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tasksArray.length > 0 && (
              <div className="text-sm text-slate-500 mr-2">
                已选{' '}
                <span className="font-semibold text-accent">
                  {selectedIds.size}
                </span>{' '}
                / {tasksArray.length}
              </div>
            )}
            <button
              onClick={batchRemind}
              disabled={selectedIds.size === 0 || remindMutation.isPending}
              className="btn-accent"
            >
              <Bell className="w-4 h-4" />
              批量催办 ({selectedIds.size})
            </button>
          </div>
        </div>

        {tasksLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">加载待催办列表中...</p>
          </div>
        ) : tasksArray.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              太棒了！暂无需要催办的事项
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              所有事项都在正常进度中，团队协作状态良好。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="divide-y divide-slate-100 min-w-[1000px]">
              <div className="grid grid-cols-[44px_2.4fr_100px_100px_140px_160px_100px_120px] gap-3 px-5 py-3 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent/30 cursor-pointer"
                  />
                </div>
                <div>事项标题</div>
                <div>状态</div>
                <div>优先级</div>
                <div>责任人</div>
                <div>截止 / 倒计时</div>
                <div className="text-center">催办次数</div>
                <div className="text-right pr-2">操作</div>
              </div>

              {tasksArray.map((t) => {
                const statusCfg = STATUS_LABEL[t.status];
                const priCfg = PRIORITY_LABEL[t.priority];
                const cd = countdownText(t.dueDate);
                const days = daysUntilLocal(t.dueDate);
                const urgent = days <= 0 || t.status === 'DELAYED';
                return (
                  <div
                    key={t.id}
                    className={cn(
                      'grid grid-cols-[44px_2.4fr_100px_100px_140px_160px_100px_120px] gap-3 px-5 py-3.5 items-center hover:bg-slate-50/60 transition-colors text-sm',
                      urgent && 'bg-amber-50/30'
                    )}
                  >
                    <div>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                        className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent/30 cursor-pointer"
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="font-medium text-slate-900 truncate"
                        title={t.title}
                      >
                        {t.title}
                      </div>
                      {t.description && (
                        <div
                          className="text-xs text-slate-400 mt-0.5 truncate"
                          title={t.description}
                        >
                          {t.description}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={cn('badge', statusCfg?.className)}>
                        {statusCfg?.label || t.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('status-dot', priCfg?.dot)} />
                      <span className="text-slate-700">
                        {priCfg?.label || t.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      {t.assignee ? (
                        <>
                          <div className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-primary/80 to-accent text-white text-[10px] font-bold flex items-center justify-center">
                            {t.assignee.name.slice(0, 1)}
                          </div>
                          <span className="text-slate-700 truncate">
                            {t.assignee.name}
                          </span>
                        </>
                      ) : (
                        <span className="badge !bg-slate-50 !text-slate-500 !border-slate-200">
                          待认领
                        </span>
                      )}
                    </div>
                    <div>
                      <div
                        className={cn(
                          'font-mono tabular-nums text-xs',
                          urgent ? 'text-danger font-semibold' : 'text-slate-700'
                        )}
                      >
                        {formatDate(t.dueDate)}
                      </div>
                      <div
                        className={cn(
                          'mt-0.5 text-xs flex items-center gap-1',
                          urgent ? 'text-danger' : 'text-amber-600'
                        )}
                      >
                        <Clock className="w-3 h-3" />
                        {cd}
                      </div>
                    </div>
                    <div className="text-center font-mono tabular-nums">
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          t.remindCount >= 3
                            ? 'text-danger'
                            : t.remindCount >= 1
                              ? 'text-amber-600'
                              : 'text-slate-500'
                        )}
                      >
                        {t.remindCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => remindOne(t.id)}
                        disabled={remindMutation.isPending}
                        className="btn-accent !py-1.5 text-xs"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        催办
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 日程提醒规则列表 */}
      <div className="card-base overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                日程提醒规则
                <span className="badge !text-[11px] !bg-primary/5 !text-primary !border-primary/20">
                  {rules.length} 条规则
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                规则持久化至数据库，调度时间写入 Redis ZSet（scheduler:reminder-rules）
              </p>
            </div>
          </div>
          <button onClick={openCreateModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            新建规则
          </button>
        </div>

        {rulesLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">加载规则列表中...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <CalendarClock className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              暂无提醒规则
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mb-4">
              创建规则后将自动同步到 Redis 调度队列，按设定周期发送催办。
            </p>
            <button onClick={openCreateModal} className="btn-primary">
              <Plus className="w-4 h-4" />
              创建第一条规则
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="divide-y divide-slate-100 min-w-[1100px]">
              <div className="grid grid-cols-[56px_1.8fr_120px_150px_140px_160px_120px_260px] gap-3 px-5 py-3 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <div>状态</div>
                <div>规则名称 / 描述</div>
                <div>频率 / 时间</div>
                <div>筛选条件</div>
                <div>渠道</div>
                <div>上次 / 下次执行</div>
                <div>创建人</div>
                <div className="text-right pr-2">操作</div>
              </div>

              {rules.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[56px_1.8fr_120px_150px_140px_160px_120px_260px] gap-3 px-5 py-3.5 items-center hover:bg-slate-50/60 transition-colors"
                >
                  <div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={r.enabled}
                        onChange={(e) =>
                          toggleRuleMutation.mutate({
                            id: r.id,
                            enabled: e.target.checked,
                          })
                        }
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {r.name}
                    </div>
                    {r.description && (
                      <div
                        className="text-xs text-slate-500 mt-0.5 line-clamp-1"
                        title={r.description}
                      >
                        {r.description}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-800">
                      {FREQUENCY_LABEL[r.frequency]}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {r.runTime}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    {r.filterStatus && (
                      <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-slate-400" />
                        <span className="truncate">
                          状态：{r.filterStatus.split(',').length} 种
                        </span>
                      </div>
                    )}
                    {r.filterPriority && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-slate-400" />
                        <span className="truncate">
                          优先级：{r.filterPriority.split(',').join('/')}
                        </span>
                      </div>
                    )}
                    {r.filterAssigneeIds && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>
                          责任人：
                          {JSON.parse(r.filterAssigneeIds).length} 人
                        </span>
                      </div>
                    )}
                    {!r.filterStatus && !r.filterPriority && !r.filterAssigneeIds && (
                      <div className="text-slate-400">全部未完成事项</div>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {r.channel.split(',').map((c) => (
                        <span
                          key={c}
                          className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-semibold border',
                            c === 'IN_APP'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : c === 'EMAIL'
                                ? 'bg-violet-50 text-violet-700 border-violet-200'
                                : c === 'SMS'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                          )}
                        >
                          {c === 'IN_APP' ? '站内' : c === 'EMAIL' ? '邮件' : c === 'SMS' ? '短信' : c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[11px] font-mono tabular-nums space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-500">
                        {r.lastRunAt ? formatDateTime(r.lastRunAt) : '未执行'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarClock className="w-3 h-3 text-primary" />
                      <span className="text-slate-800 font-medium">
                        {r.nextRunAt ? formatDateTime(r.nextRunAt) : '未计划'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 truncate">
                    {r.creator?.name || '-'}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    <button
                      onClick={() => triggerRuleMutation.mutate(r.id)}
                      disabled={triggerRuleMutation.isPending}
                      className="btn-accent !py-1 !px-2 text-[11px]"
                      title="忽略时间立即按规则发送"
                    >
                      <Play className="w-3 h-3" />
                      手动触发
                    </button>
                    <button
                      onClick={() => openEditModal(r)}
                      className="btn-secondary !py-1 !px-2 text-[11px]"
                    >
                      <Pencil className="w-3 h-3" />
                      编辑
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`确定删除规则「${r.name}」？`)) {
                          deleteRuleMutation.mutate(r.id);
                        }
                      }}
                      className="btn-secondary !py-1 !px-2 text-[11px] text-danger hover:!bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 新建 / 编辑弹窗 */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div
            className="relative z-10 w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                {editingId ? '编辑提醒规则' : '新建提醒规则'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="label-base">规则名称 *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="如：周一晨会催办、逾期每日提醒、高优先级每 2 小时..."
                    className="input-base"
                    maxLength={80}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label-base">规则描述</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="可选，简要说明用途"
                    className="input-base"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="label-base flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-primary" />
                    执行频率 *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { v: 'DAILY', label: '每日', icon: Clock },
                        { v: 'WEEKLY', label: '每周', icon: CalendarDays },
                        { v: 'MONTHLY', label: '每月', icon: CalendarRange },
                        { v: 'ONCE', label: '单次', icon: CalendarDays },
                      ] as { v: Frequency; label: string; icon: any }[]
                    ).map(({ v, label, icon: Icon }) => {
                      const active = form.frequency === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setForm({ ...form, frequency: v })}
                          className={cn(
                            'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-150',
                            active
                              ? 'border-primary bg-primary/5 text-primary shadow-soft'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="label-base flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    执行时间 *
                  </label>
                  <input
                    type="time"
                    value={form.runTime}
                    onChange={(e) => setForm({ ...form, runTime: e.target.value })}
                    className="input-base"
                  />
                </div>

                {form.frequency === 'WEEKLY' && (
                  <div>
                    <label className="label-base">每周执行日</label>
                    <div className="relative">
                      <select
                        value={form.runDayOfWeek}
                        onChange={(e) =>
                          setForm({ ...form, runDayOfWeek: Number(e.target.value) })
                        }
                        className="input-base appearance-none pr-9"
                      >
                        {WEEKDAY_OPTIONS.map((d) => (
                          <option key={d.v} value={d.v}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {form.frequency === 'MONTHLY' && (
                  <div>
                    <label className="label-base">每月执行日 (1-31)</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={form.runDayOfMonth}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          runDayOfMonth: Math.max(1, Math.min(31, Number(e.target.value) || 1)),
                        })
                      }
                      className="input-base"
                    />
                  </div>
                )}

                {form.frequency === 'ONCE' && (
                  <div>
                    <label className="label-base">单次执行日期</label>
                    <input
                      type="date"
                      value={form.runOnceAt}
                      onChange={(e) => setForm({ ...form, runOnceAt: e.target.value })}
                      className="input-base"
                    />
                  </div>
                )}

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <label className="label-base">事项状态筛选</label>
                    <input
                      type="text"
                      value={form.filterStatus}
                      onChange={(e) =>
                        setForm({ ...form, filterStatus: e.target.value })
                      }
                      placeholder="逗号分隔，如 IN_PROGRESS,DELAYED"
                      className="input-base !py-2 text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      空=全部未完成；可选 PENDING_CLAIM/IN_PROGRESS/DELAYED
                    </p>
                  </div>
                  <div>
                    <label className="label-base">优先级筛选</label>
                    <input
                      type="text"
                      value={form.filterPriority}
                      onChange={(e) =>
                        setForm({ ...form, filterPriority: e.target.value })
                      }
                      placeholder="逗号分隔，如 HIGH,URGENT"
                      className="input-base !py-2 text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      空=全部；可选 LOW/MEDIUM/HIGH/URGENT
                    </p>
                  </div>
                  <div>
                    <label className="label-base">提醒渠道</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['IN_APP', 'EMAIL', 'SMS'].map((ch) => {
                        const active = form.channel.includes(ch);
                        return (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => {
                              const set = new Set(
                                form.channel.split(',').filter(Boolean)
                              );
                              if (set.has(ch)) set.delete(ch);
                              else set.add(ch);
                              setForm({
                                ...form,
                                channel: Array.from(set).join(','),
                              });
                            }}
                            className={cn(
                              'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                              active
                                ? ch === 'IN_APP'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : ch === 'EMAIL'
                                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            )}
                          >
                            {ch === 'IN_APP' ? '站内' : ch === 'EMAIL' ? '邮件' : '短信'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="label-base">责任人筛选（空=全部）</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-slate-200 bg-white">
                    {(usersData || []).length === 0 ? (
                      <span className="text-xs text-slate-400 py-2">
                        加载用户列表中...
                      </span>
                    ) : (
                      (usersData || []).map((u) => {
                        const active = form.filterAssigneeIds.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleAssignee(u.id)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                              active
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            )}
                          >
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/80 to-primary text-white text-[10px] font-bold flex items-center justify-center">
                              {u.name.slice(0, 1)}
                            </div>
                            {u.name}
                            {u.department && (
                              <span className="text-[10px] text-slate-400">
                                · {u.department}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="label-base">催办文案 *</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="支持占位符：{{title}}（事项标题）、{{assignee}}（责任人）、{{date}}（当日日期）"
                    className="input-base min-h-[110px] resize-y"
                    maxLength={1000}
                  />
                  <div className="mt-1 text-xs text-slate-400 flex justify-between">
                    <span>
                      可用占位符：{' '}
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {'{{title}}'}
                      </code>{' '}
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {'{{assignee}}'}
                      </code>{' '}
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {'{{date}}'}
                      </code>
                    </span>
                    <span className="font-mono tabular-nums">
                      {form.content.length} / 1000
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-sm font-medium text-slate-800">启用该规则</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      启用后将按频率写入 Redis 调度队列，到达时间自动执行
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.enabled}
                      onChange={(e) =>
                        setForm({ ...form, enabled: e.target.checked })
                      }
                    />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                onClick={() => setModalOpen(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={submitForm}
                disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                {editingId ? '保存修改' : '创建规则'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function daysUntilLocal(date: Date | string | null | undefined): number {
  if (!date) return Infinity;
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}
