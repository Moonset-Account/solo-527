'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Paperclip,
  CalendarDays,
  GripVertical,
  Check,
  User as UserIcon,
  AlertTriangle,
  Clock3,
  HandCoins,
  MessageSquarePlus,
  ChevronUp,
  ChevronDown,
  Loader2,
  X,
  Send,
} from 'lucide-react';
import {
  cn,
  STATUS_LABEL,
  PRIORITY_LABEL,
  countdownText,
  daysUntil,
  formatDate,
  formatDateTime,
} from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import type { TaskListItem } from '@/types';

interface Props {
  task: TaskListItem;
  onClick: () => void;
  onMutationSuccess?: () => void;
}

export function TaskCard({ task, onClick, onMutationSuccess }: Props) {
  const { user } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProgress, setShowProgress] = useState(false);
  const [showDelay, setShowDelay] = useState(false);
  const [progressVal, setProgressVal] = useState(task.progress);
  const [remark, setRemark] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  const statusMeta = STATUS_LABEL[task.status] || STATUS_LABEL.PENDING_CLAIM;
  const priorityMeta = PRIORITY_LABEL[task.priority] || PRIORITY_LABEL.MEDIUM;
  const days = daysUntil(task.dueDate);
  const isMyTask = task.assignee?.id === user?.id;
  const canClaim = task.status === 'PENDING_CLAIM';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ADMIN_LEAD';
  const canEditProgress = isMyTask && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';

  // 认领
  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${task.id}/claim`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast('认领成功！请尽快处理该事项', 'success');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onMutationSuccess?.();
    },
    onError: (e: any) => toast(e.message || '认领失败', 'error'),
  });

  // 进度更新
  const progressMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${task.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: progressVal, remark: remark || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (d) => {
      toast(
        d.status === 'COMPLETED'
          ? '🎉 恭喜，事项已完成！'
          : '进度已更新',
        'success'
      );
      setShowProgress(false);
      setRemark('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onMutationSuccess?.();
    },
    onError: (e: any) => toast(e.message || '更新失败', 'error'),
  });

  // 延期原因
  const delayMutation = useMutation({
    mutationFn: async () => {
      if (!delayReason.trim()) throw new Error('请填写延期原因');
      const res = await fetch(`/api/tasks/${task.id}/delay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: delayReason,
          expectedDate: expectedDate || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast('延期原因已记录', 'success');
      setShowDelay(false);
      setDelayReason('');
      setExpectedDate('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onMutationSuccess?.();
    },
    onError: (e: any) => toast(e.message || '提交失败', 'error'),
  });

  const overdue = days < 0;

  return (
    <div
      className={cn(
        'card-base card-hover relative overflow-hidden cursor-pointer group',
        overdue && task.status !== 'COMPLETED' &&
          'ring-1 ring-amber-300/50'
      )}
      onClick={onClick}
    >
      {/* 左侧优先级色条 */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1',
          priorityMeta.bar
        )}
      />

      <div className="p-5 pl-6 space-y-3.5" onClick={(e) => e.stopPropagation()}>
        {/* 顶部：标题 + 状态 + 截止 */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <span className={cn('status-dot mt-1.5', priorityMeta.dot)} />
              <h3 className="text-[15px] font-semibold text-slate-900 leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
                {task.title}
              </h3>
            </div>
            {task.description && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 ml-3.5">
                {task.description}
              </p>
            )}
          </div>
          <span className={cn('badge shrink-0', statusMeta.className)}>
            {statusMeta.label}
          </span>
        </div>

        {/* 高频区：进度条 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <GripVertical className="w-3 h-3" />
              进度
            </span>
            <span
              className={cn(
                'font-mono font-semibold tabular-nums',
                task.progress >= 100
                  ? 'text-success'
                  : task.progress > 50
                    ? 'text-primary'
                    : 'text-slate-600'
              )}
            >
              {task.progress}%
            </span>
          </div>
          <div className="progress-track">
            <div
              className={cn(
                'progress-fill',
                task.progress >= 100
                  ? 'bg-success'
                  : task.progress > 50
                    ? 'bg-primary'
                    : task.progress > 0
                      ? 'bg-sky-400'
                      : 'bg-slate-200'
              )}
              style={{ width: `${Math.min(100, task.progress)}%` }}
            />
          </div>

          {/* 内联进度编辑 */}
          {canEditProgress && showProgress && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progressVal}
                  onChange={(e) => setProgressVal(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <div className="relative w-20">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={progressVal}
                    onChange={(e) =>
                      setProgressVal(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                    }
                    className="input-base !py-1.5 !pr-6 text-center font-mono font-semibold"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    %
                  </span>
                </div>
              </div>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="补充进度说明（可选，例如：已完成用户中心测试，报表中心进行中）"
                rows={2}
                className="input-base text-xs resize-none"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowProgress(false);
                    setProgressVal(task.progress);
                    setRemark('');
                  }}
                  className="btn-ghost text-xs"
                >
                  取消
                </button>
                <button
                  onClick={() => progressMutation.mutate()}
                  disabled={progressMutation.isPending}
                  className="btn-primary !px-4 !py-1.5 text-xs"
                >
                  {progressMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  提交进度
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 延期原因录入 */}
        {canEditProgress && showDelay && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              请补充延期原因
            </div>
            <textarea
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              placeholder="请详细说明延期原因，例如：法务审核流程较预期慢，预计本周五前完成"
              rows={3}
              className="input-base text-xs resize-none border-amber-200 focus:ring-amber-300/30 focus:border-amber-400"
            />
            <div>
              <label className="text-xs text-slate-600 mb-1 block">
                预计完成日期（可选）
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="input-base text-xs"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDelay(false);
                  setDelayReason('');
                  setExpectedDate('');
                }}
                className="btn-ghost text-xs"
              >
                取消
              </button>
              <button
                onClick={() => delayMutation.mutate()}
                disabled={delayMutation.isPending}
                className="btn-accent !px-4 !py-1.5 text-xs"
              >
                {delayMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                提交
              </button>
            </div>
          </div>
        )}

        {/* 元信息行 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 pt-1">
          <div
            className={cn(
              'flex items-center gap-1.5 font-medium',
              overdue && task.status !== 'COMPLETED'
                ? 'text-amber-700'
                : days <= 2 && task.status !== 'COMPLETED'
                  ? 'text-primary'
                  : ''
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>
              {countdownText(task.dueDate)}
              {task.dueDate && (
                <span className="ml-1 text-slate-400 font-normal">
                  ({formatDate(task.dueDate)})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5" />
            {task.assignee ? (
              <>
                <span className="text-slate-700 font-medium">{task.assignee.name}</span>
                {task.assignee.department && (
                  <span className="text-slate-400">· {task.assignee.department}</span>
                )}
              </>
            ) : (
              <span className="text-slate-400">待认领</span>
            )}
          </div>

          {task.remindCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600 font-medium">
              <Clock3 className="w-3.5 h-3.5" />
              已催办 {task.remindCount} 次
            </div>
          )}

          {task.delayReasonsCount > 0 && (
            <div className="flex items-center gap-1.5 text-orange-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              有延期记录
            </div>
          )}

          {task.progressRecordsCount > 0 && (
            <div className="flex items-center gap-1.5">
              <MessageSquarePlus className="w-3.5 h-3.5" />
              进度 {task.progressRecordsCount}
            </div>
          )}
        </div>

        {/* 操作按钮区 */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {canClaim && (
            <button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="btn-primary !px-4 !py-1.5 text-xs"
            >
              {claimMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <HandCoins className="w-3.5 h-3.5" />
              )}
              认领此事项
            </button>
          )}

          {canEditProgress && !showProgress && (
            <button
              onClick={() => {
                setShowProgress(true);
                setShowDelay(false);
                setProgressVal(task.progress);
              }}
              className="btn-secondary !px-4 !py-1.5 text-xs"
            >
              {task.progress === 0 ? (
                <>
                  <Paperclip className="w-3.5 h-3.5" />
                  开始处理
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  补充进度
                </>
              )}
            </button>
          )}

          {canEditProgress && task.status !== 'COMPLETED' && (
            <button
              onClick={() => {
                setShowDelay(!showDelay);
                if (!showDelay) setShowProgress(false);
              }}
              className={cn(
                'btn-secondary !px-4 !py-1.5 text-xs',
                showDelay && '!bg-amber-50 !border-amber-200 !text-amber-700'
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {showDelay ? '收起' : '延期说明'}
            </button>
          )}

          <button
            onClick={onClick}
            className="btn-ghost !px-3 !py-1.5 text-xs ml-auto"
          >
            查看详情
            <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
          </button>
        </div>
      </div>
    </div>
  );
}
