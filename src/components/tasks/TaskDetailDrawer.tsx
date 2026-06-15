'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  CalendarCheck,
  FileText,
  Clock,
  User as UserIcon,
  CalendarDays,
  AlertTriangle,
  MessageSquare,
  Loader2,
  GitBranch,
  ChevronRight,
  SendHorizonal,
  Users,
} from 'lucide-react';
import { cn, STATUS_LABEL, PRIORITY_LABEL, formatDateTime, formatDate } from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';

interface Props {
  taskId: string;
  onClose: () => void;
  onMutationSuccess?: () => void;
}

type TabKey = 'timeline' | 'progress' | 'minutes' | 'delays' | 'reminders';

export function TaskDetailDrawer({ taskId, onClose, onMutationSuccess }: Props) {
  const [tab, setTab] = useState<TabKey>('timeline');
  const { user } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['task-detail', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!data && !isLoading) return null;
  const task = data;
  const statusMeta = task ? STATUS_LABEL[task.status] : null;
  const priorityMeta = task ? PRIORITY_LABEL[task.priority] : null;

  const tabs: Array<{ key: TabKey; label: string; icon: any; count?: number }> = [
    { key: 'timeline', label: '流程节点', icon: GitBranch, count: task?.processNodes?.length },
    { key: 'progress', label: '进度记录', icon: MessageSquare, count: task?.progressRecords?.length },
    { key: 'delays', label: '延期原因', icon: AlertTriangle, count: task?.delayReasons?.length },
    { key: 'reminders', label: '催办记录', icon: SendHorizonal, count: task?.reminders?.length },
    { key: 'minutes', label: '会议纪要', icon: FileText, count: task?.meetingMinutes ? 1 : 0 },
  ];

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="p-6 border-b border-slate-100 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {isLoading ? (
            <div className="flex items-center gap-3 py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-slate-500">加载中...</span>
            </div>
          ) : task ? (
            <>
              <div className="flex items-start gap-3 mb-3 pr-10">
                <span className={cn('status-dot mt-1.5 shrink-0', priorityMeta?.dot)} />
                <h2 className="text-lg font-bold text-slate-900 leading-snug flex-1">
                  {task.title}
                </h2>
              </div>
              {task.description && (
                <p className="text-sm text-slate-600 leading-relaxed mb-4 ml-3.5">
                  {task.description}
                </p>
              )}

              {/* 关键指标网格 */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <DetailItem
                  icon={<UserIcon className="w-4 h-4" />}
                  label="责任人"
                  value={task.assignee?.name || '(待认领)'}
                  sub={task.assignee?.department}
                />
                <DetailItem
                  icon={<CalendarDays className="w-4 h-4" />}
                  label="截止日期"
                  value={task.dueDate ? formatDate(task.dueDate) : '未设置'}
                  highlight={
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    task.status !== 'COMPLETED'
                      ? 'amber'
                      : undefined
                  }
                />
                <DetailItem
                  icon={<CalendarCheck className="w-4 h-4" />}
                  label="状态"
                  value={statusMeta?.label}
                  badge={statusMeta?.className}
                />
                <DetailItem
                  icon={<GitBranch className="w-4 h-4" />}
                  label="优先级"
                  value={priorityMeta?.label}
                />
                <DetailItem
                  icon={<Clock className="w-4 h-4" />}
                  label="创建于"
                  value={formatDateTime(task.createdAt)}
                  sub={`创建人：${task.creator?.name}`}
                />
                <DetailItem
                  icon={<SendHorizonal className="w-4 h-4" />}
                  label="催办次数"
                  value={`${task.remindCount} 次`}
                  sub={task.lastRemindedAt ? `上次：${formatDateTime(task.lastRemindedAt)}` : undefined}
                />
              </div>

              {/* 大进度条 */}
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">当前进度</span>
                  <span
                    className={cn(
                      'text-xl font-bold font-mono tabular-nums',
                      task.progress >= 100
                        ? 'text-success'
                        : 'text-primary'
                    )}
                  >
                    {task.progress}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-white border border-slate-100 overflow-hidden shadow-inner">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700 ease-out',
                      task.progress >= 100
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        : task.progress > 50
                          ? 'bg-gradient-to-r from-sky-400 to-primary'
                          : 'bg-gradient-to-r from-sky-300 to-sky-500'
                    )}
                    style={{ width: `${Math.min(100, task.progress)}%` }}
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Tab 切换 */}
        {task && (
          <div className="border-b border-slate-100 px-4 pt-3 overflow-x-auto no-scrollbar">
            <div className="flex gap-1 min-w-max">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                      active
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {typeof t.count === 'number' && t.count > 0 && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 内容 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {task && tab === 'timeline' && <TimelineTab nodes={task.processNodes || []} />}
          {task && tab === 'progress' && <ProgressTab records={task.progressRecords || []} />}
          {task && tab === 'delays' && <DelayTab delays={task.delayReasons || []} />}
          {task && tab === 'reminders' && <ReminderTab reminders={task.reminders || []} />}
          {task && tab === 'minutes' && <MinutesTab minutes={task.meetingMinutes} />}
        </div>
      </div>
    </>
  );
}

function DetailItem({
  icon,
  label,
  value,
  sub,
  badge,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  badge?: string;
  highlight?: 'amber' | 'red' | 'green';
}) {
  const hl = {
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
    green: 'bg-emerald-50 border-emerald-200',
  };
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 p-3 rounded-lg bg-slate-50/60 border border-slate-100',
        highlight && hl[highlight]
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
        {badge ? (
          <span className={cn('badge text-[11px]', badge)}>{value}</span>
        ) : (
          <div className="text-sm font-medium text-slate-800 truncate">{value}</div>
        )}
        {sub && <div className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  );
}

function TimelineTab({ nodes }: { nodes: any[] }) {
  if (nodes.length === 0) {
    return <EmptyState title="暂无流程节点记录" icon={<GitBranch className="w-6 h-6" />} />;
  }
  return (
    <ol className="relative border-l-2 border-slate-100 ml-3 space-y-6">
      {nodes.map((n, i) => (
        <li key={n.id} className="pl-5 relative">
          <span
            className={cn(
              'absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-soft',
              i === nodes.length - 1 ? 'bg-primary' : 'bg-slate-300'
            )}
          >
            {i === nodes.length - 1 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </span>
          <div className="text-sm font-semibold text-slate-800 mb-1">{n.nodeName}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDateTime(n.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {n.operator?.name}
            </span>
            {n.fromStatus && (
              <span className="text-slate-400">
                {STATUS_LABEL[n.fromStatus]?.label || n.fromStatus}
                <ChevronRight className="w-3 h-3 inline" />
                {STATUS_LABEL[n.toStatus]?.label || n.toStatus}
              </span>
            )}
          </div>
          {n.remark && (
            <p className="text-sm text-slate-600 p-3 rounded-lg bg-slate-50 border border-slate-100 leading-relaxed">
              {n.remark}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function ProgressTab({ records }: { records: any[] }) {
  if (records.length === 0) {
    return <EmptyState title="暂无进度补充记录" icon={<MessageSquare className="w-6 h-6" />} />;
  }
  return (
    <div className="space-y-3">
      {records.map((r) => (
        <div
          key={r.id}
          className="p-4 rounded-xl bg-white border border-slate-100 shadow-card"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary text-white text-xs font-bold flex items-center justify-center">
                {r.user?.name?.slice(0, 1)}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">{r.user?.name}</div>
                <div className="text-[11px] text-slate-400">{formatDateTime(r.createdAt)}</div>
              </div>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-primary">
              {r.progress}%
            </div>
          </div>
          {r.remark && (
            <p className="text-sm text-slate-600 leading-relaxed mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              {r.remark}
            </p>
          )}
          <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-primary"
              style={{ width: `${r.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DelayTab({ delays }: { delays: any[] }) {
  if (delays.length === 0) {
    return <EmptyState title="暂无延期记录" icon={<AlertTriangle className="w-6 h-6" />} desc="若事项已延期，请录入延期原因及预计完成日期" />;
  }
  return (
    <div className="space-y-3">
      {delays.map((d) => (
        <div
          key={d.id}
          className="p-4 rounded-xl bg-amber-50/50 border border-amber-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-semibold">延期说明</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-600/80">
              <UserIcon className="w-3 h-3" />
              {d.user?.name}
            </div>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed p-3 bg-white rounded-lg border border-amber-100 mb-3">
            {d.reason}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              提交时间：{formatDateTime(d.createdAt)}
            </span>
            {d.expectedDate && (
              <span className="font-medium text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                预计完成：{formatDate(d.expectedDate)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReminderTab({ reminders }: { reminders: any[] }) {
  if (reminders.length === 0) {
    return <EmptyState title="暂无催办记录" icon={<SendHorizonal className="w-6 h-6" />} />;
  }
  const typeLabel: Record<string, string> = {
    MANUAL: '手动催办',
    SCHEDULED: '定时提醒',
    AUTO_DELAY: '自动延期提醒',
  };
  const channelLabel: Record<string, string> = {
    IN_APP: '站内消息',
    EMAIL: '邮件',
    SMS: '短信',
  };
  return (
    <div className="space-y-3">
      {reminders.map((r) => (
        <div
          key={r.id}
          className="p-4 rounded-xl bg-orange-50/50 border border-orange-200"
        >
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="badge bg-orange-100 text-orange-700 border-orange-200 !border">
                {typeLabel[r.type] || r.type}
              </span>
              <span className="text-xs text-slate-500">
                {channelLabel[r.channel] || r.channel}
              </span>
            </div>
            <span className="text-xs text-slate-400">{formatDateTime(r.sentAt)}</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed p-3 bg-white rounded-lg border border-orange-100">
            {r.content}
          </p>
          <div className="mt-2 text-right text-xs text-slate-500">
            发送人：{r.sender?.name}
          </div>
        </div>
      ))}
    </div>
  );
}

function MinutesTab({ minutes }: { minutes: any }) {
  if (!minutes) {
    return <EmptyState title="未关联会议纪要" icon={<FileText className="w-6 h-6" />} desc="此事项未关联任何周会会议纪要" />;
  }
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900">{minutes.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            会议日期：{formatDate(minutes.meetingDate)}
          </div>
        </div>
      </div>
      <div className="p-5 rounded-xl bg-white border border-slate-100 shadow-card">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          会议内容
        </div>
        <div className="text-sm text-slate-700 leading-7 whitespace-pre-line">
          {minutes.content}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  desc,
  icon,
}: {
  title: string;
  desc?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
        {icon}
      </div>
      <div className="text-sm font-medium text-slate-600 mb-1">{title}</div>
      {desc && <div className="text-xs text-slate-400 max-w-xs">{desc}</div>}
    </div>
  );
}
