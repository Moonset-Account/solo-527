'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  ArrowLeft,
  FileText,
  UserRound,
  Flag,
  Calendar,
  Link2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { cn, PRIORITY_LABEL } from '@/lib/utils';
import type { TaskPriority } from '@/types';

interface SimpleUser {
  id: string;
  name: string;
  department?: string | null;
  role: string;
}

export default function NewTaskPage() {
  const router = useRouter();
  const { user } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [meetingMinutesId, setMeetingMinutesId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['simple-users'],
    queryFn: async () => {
      const res = await fetch('/api/users?simple=true');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as SimpleUser[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: any = { title, priority };
      if (description) body.description = description;
      if (assigneeId) body.assigneeId = assigneeId;
      if (dueDate) body.dueDate = dueDate;
      if (meetingMinutesId) body.meetingMinutesId = meetingMinutesId;

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['admin-home-statistics'] });
      toast('待办事项已创建', 'success');
      router.push('/admin/tasks');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = '请输入待办标题';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate();
  };

  const PRIORITY_ORDER: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="btn-secondary !px-3 !py-2"
          title="返回"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-6 h-6 text-primary" />
            新建待办事项
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            创建周会跟进事项，可指定责任人并设置截止日期
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="card-base p-6 lg:p-8 space-y-6">
        <div>
          <label className="label-base flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-primary" />
            标题 <span className="text-danger">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors({ ...errors, title: '' });
            }}
            placeholder="请输入待办事项标题（例如：完成Q2季度财务报表）"
            className={cn('input-base', errors.title && '!border-danger focus:!ring-danger/20')}
            maxLength={200}
          />
          {errors.title && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle className="w-3 h-3" />
              {errors.title}
            </div>
          )}
        </div>

        <div>
          <label className="label-base">事项描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="补充具体的执行要求、背景信息、参考资料等..."
            className="input-base min-h-[110px] resize-y"
            maxLength={2000}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-base flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-primary" />
              优先级
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITY_ORDER.map((p) => {
                const cfg = PRIORITY_LABEL[p];
                const active = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150',
                      active
                        ? 'border-primary bg-primary/5 text-primary shadow-soft'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <span className={cn('w-2.5 h-2.5 rounded-full', cfg?.dot)} />
                    {cfg?.label || p}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label-base flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              截止日期
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-base"
            />
          </div>
        </div>

        <div>
          <label className="label-base flex items-center gap-1">
            <UserRound className="w-3.5 h-3.5 text-primary" />
            责任人（可选，留空=待认领）
          </label>
          <div className="relative">
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={usersLoading}
              className="input-base appearance-none pr-9"
            >
              <option value="">待认领（后续由用户自行认领）</option>
              {(users || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.department ? ` · ${u.department}` : ''}
                </option>
              ))}
            </select>
            <UserRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="label-base flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5 text-primary" />
            关联会议纪要 ID（可选）
          </label>
          <input
            value={meetingMinutesId}
            onChange={(e) => setMeetingMinutesId(e.target.value)}
            placeholder="例如：meeting-2024w12，便于追溯事项来源"
            className="input-base"
          />
        </div>

        <div className="divider" />

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary min-w-[120px]"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                创建待办
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
