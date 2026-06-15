'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BellRing,
  AlertCircle,
  Clock,
  UserRound,
  CalendarClock,
  Settings2,
  Mail,
  MessageSquare,
  Check,
  Loader2,
  Inbox,
  RefreshCw,
  Save,
  ChevronDown,
} from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import {
  cn,
  STATUS_LABEL,
  PRIORITY_LABEL,
  formatDate,
  countdownText,
} from '@/lib/utils';
import type { TaskListItem, TaskPriority } from '@/types';

type Frequency = 'DAILY' | 'WEEKLY' | 'CUSTOM';
type ReminderType = 'IN_SITE' | 'EMAIL' | 'BOTH';

interface ReminderConfig {
  frequency: Frequency;
  customTime?: string;
  weekday?: number;
  reminderType: ReminderType;
  defaultMessage: string;
  enabled: boolean;
}

const DEFAULT_CONFIG: ReminderConfig = {
  frequency: 'DAILY',
  customTime: '09:00',
  weekday: 1,
  reminderType: 'IN_SITE',
  defaultMessage: '您好，您有待办事项即将到期，请及时跟进处理。',
  enabled: true,
};

const STORAGE_KEY = 'admin:reminder-config';

export default function RemindersPage() {
  const { user } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<ReminderConfig>(DEFAULT_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch {
      // ignore
    }
    setConfigLoaded(true);
  }, []);

  const { data, isLoading, refetch } = useQuery({
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

  const tasks = data || [];

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

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tasks.map((t) => t.id)));
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

  const saveConfig = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      toast('提醒配置已保存', 'success');
    } catch {
      toast('保存失败', 'error');
    }
  };

  const allSelected = tasks.length > 0 && selectedIds.size === tasks.length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BellRing className="w-6 h-6 text-accent" />
            催办提醒中心
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            快速处理临近截止或已逾期的事项，配置自动提醒规则
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
                  {tasks.length} 条待处理
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                状态≠已完成，且截止日期已过或 3 天内到期的事项
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tasks.length > 0 && (
              <div className="text-sm text-slate-500 mr-2">
                已选{' '}
                <span className="font-semibold text-accent">
                  {selectedIds.size}
                </span>{' '}
                / {tasks.length}
              </div>
            )}
            <button
              onClick={batchRemind}
              disabled={selectedIds.size === 0}
              className="btn-accent"
            >
              <Bell className="w-4 h-4" />
              批量催办 ({selectedIds.size})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">加载待催办列表中...</p>
          </div>
        ) : tasks.length === 0 ? (
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

              {tasks.map((t) => {
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

      <div className="card-base overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                日程提醒规则配置
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                配置自动提醒的周期、渠道和文案（保存在浏览器本地）
              </p>
            </div>
          </div>
          {configLoaded && (
            <button onClick={saveConfig} className="btn-primary">
              <Save className="w-4 h-4" />
              保存配置
            </button>
          )}
        </div>

        {!configLoaded ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin mb-3" />
            <p className="text-sm">加载配置中...</p>
          </div>
        ) : (
          <div className="p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="label-base flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-primary" />
                  提醒周期
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { v: 'DAILY', label: '每日', icon: Clock },
                      { v: 'WEEKLY', label: '每周', icon: CalendarClock },
                      { v: 'CUSTOM', label: '自定义', icon: Settings2 },
                    ] as { v: Frequency; label: string; icon: any }[]
                  ).map(({ v, label, icon: Icon }) => {
                    const active = config.frequency === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setConfig({ ...config, frequency: v })
                        }
                        className={cn(
                          'inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150',
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

              {config.frequency === 'WEEKLY' && (
                <div>
                  <label className="label-base">每周执行日</label>
                  <div className="relative">
                    <select
                      value={config.weekday}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          weekday: Number(e.target.value),
                        })
                      }
                      className="input-base appearance-none pr-9 !py-2"
                    >
                      {[
                        { v: 1, label: '周一' },
                        { v: 2, label: '周二' },
                        { v: 3, label: '周三' },
                        { v: 4, label: '周四' },
                        { v: 5, label: '周五' },
                        { v: 6, label: '周六' },
                        { v: 0, label: '周日' },
                      ].map((d) => (
                        <option key={d.v} value={d.v}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {(config.frequency === 'CUSTOM' ||
                config.frequency === 'WEEKLY' ||
                config.frequency === 'DAILY') && (
                <div>
                  <label className="label-base flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    提醒时间
                  </label>
                  <input
                    type="time"
                    value={config.customTime || '09:00'}
                    onChange={(e) =>
                      setConfig({ ...config, customTime: e.target.value })
                    }
                    className="input-base !py-2"
                  />
                </div>
              )}

              <div>
                <label className="label-base">提醒渠道</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { v: 'IN_SITE', label: '站内', icon: MessageSquare },
                      { v: 'EMAIL', label: '邮件', icon: Mail },
                      { v: 'BOTH', label: '两者都', icon: Bell },
                    ] as { v: ReminderType; label: string; icon: any }[]
                  ).map(({ v, label, icon: Icon }) => {
                    const active = config.reminderType === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setConfig({ ...config, reminderType: v })
                        }
                        className={cn(
                          'inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150',
                          active
                            ? 'border-accent bg-amber-50 text-amber-700 shadow-soft'
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
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-base">默认催办文案</label>
                <textarea
                  value={config.defaultMessage}
                  onChange={(e) =>
                    setConfig({ ...config, defaultMessage: e.target.value })
                  }
                  placeholder="例如：您好，您有待办事项即将到期，请及时跟进处理。"
                  className="input-base min-h-[140px] resize-y"
                  maxLength={500}
                />
                <div className="mt-1 text-xs text-slate-400 flex justify-between">
                  <span>支持占位符，可在发送时动态替换</span>
                  <span className="font-mono tabular-nums">
                    {config.defaultMessage.length} / 500
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    启用自动提醒
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    按上述规则定时发送催办提醒（本地配置）
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.enabled}
                    onChange={(e) =>
                      setConfig({ ...config, enabled: e.target.checked })
                    }
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                </label>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-xs text-slate-600 leading-relaxed">
                <div className="font-semibold text-primary mb-1.5 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5" />
                  配置预览
                </div>
                <ul className="space-y-1 text-slate-600">
                  <li>
                    · 频率：
                    <span className="font-medium text-slate-800">
                      {config.frequency === 'DAILY'
                        ? '每日'
                        : config.frequency === 'WEEKLY'
                          ? `每周${['日', '一', '二', '三', '四', '五', '六'][config.weekday || 1]}`
                          : '自定义时间'}
                      {config.customTime &&
                        ` ${config.customTime} 执行`}
                    </span>
                  </li>
                  <li>
                    · 渠道：
                    <span className="font-medium text-slate-800">
                      {config.reminderType === 'IN_SITE'
                        ? '站内消息'
                        : config.reminderType === 'EMAIL'
                          ? '邮件通知'
                          : '站内 + 邮件'}
                    </span>
                  </li>
                  <li>
                    · 状态：
                    <span
                      className={cn(
                        'font-medium',
                        config.enabled ? 'text-emerald-600' : 'text-slate-400'
                      )}
                    >
                      {config.enabled ? '已启用' : '已停用'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
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
