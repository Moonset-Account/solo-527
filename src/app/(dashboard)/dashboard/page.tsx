'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Filter,
  Plus,
  Download,
  Search,
  Clock,
  Users2,
  ListTodo,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import {
  cn,
  STATUS_LABEL,
  PRIORITY_LABEL,
  countdownText,
  formatDate,
} from '@/lib/utils';
import type { TaskStatus, TaskPriority, TaskListItem } from '@/types';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailDrawer } from '@/components/tasks/TaskDetailDrawer';
import { StatusTabs } from '@/components/tasks/StatusTabs';

const STATUSES: TaskStatus[] = [
  'PENDING_CLAIM',
  'IN_PROGRESS',
  'DELAYED',
  'COMPLETED',
];

export default function DashboardPage() {
  const { user } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [keyword, setKeyword] = useState('');
  const [priority, setPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'tasks',
      { status: activeStatus, priority, keyword, mine: user?.role === 'USER' },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeStatus !== 'ALL') params.set('status', activeStatus);
      if (priority !== 'ALL') params.set('priority', priority);
      if (keyword) params.set('keyword', keyword);
      if (user?.role === 'USER') params.set('mine', 'true');
      params.set('pageSize', '100');
      const res = await fetch(`/api/tasks?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { total: number; items: TaskListItem[] };
    },
    enabled: !!user,
  });

  const counts = useMemo(() => {
    const items = data?.items || [];
    return {
      ALL: items.length,
      PENDING_CLAIM: items.filter((t) => t.status === 'PENDING_CLAIM').length,
      IN_PROGRESS: items.filter((t) => t.status === 'IN_PROGRESS').length,
      DELAYED: items.filter((t) => t.status === 'DELAYED').length,
      COMPLETED: items.filter((t) => t.status === 'COMPLETED').length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    const items = data?.items || [];
    return items;
  }, [data, activeStatus]);

  const handleRefresh = async () => {
    await refetch();
    toast('列表已刷新', 'success');
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* 头部 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {user?.role === 'USER' ? '我的待办' : '待办工作台'}
            {counts.ALL > 0 && (
              <span className="text-sm font-normal text-slate-400 ml-2">
                共 {counts.ALL} 项
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            认领待办 · 补充进度 · 跟踪流程节点（所有操作在本页即可完成）
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="btn-secondary !px-3 !py-2"
            title="刷新"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            导出
          </button>
          {(user?.role === 'ADMIN' || user?.role === 'ADMIN_LEAD') && (
            <a href="/admin/tasks/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              新建待办
            </a>
          )}
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="全部事项"
          value={counts.ALL}
          icon={<ListTodo className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          label="进行中"
          value={counts.IN_PROGRESS}
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="已延期"
          value={counts.DELAYED}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          label="已完成"
          value={counts.COMPLETED}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
      </div>

      {/* 筛选 + 搜索 */}
      <div className="card-base p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索待办标题、描述..."
              className="input-base pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="input-base !w-auto min-w-[130px] !py-2"
            >
              <option value="ALL">全部优先级</option>
              <option value="URGENT">紧急</option>
              <option value="HIGH">高</option>
              <option value="MEDIUM">中</option>
              <option value="LOW">低</option>
            </select>
          </div>
        </div>

        <StatusTabs
          counts={counts as any}
          active={activeStatus}
          onChange={setActiveStatus}
        />
      </div>

      {/* 待办列表 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">加载中...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-base p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">
            当前分类暂无事项
          </h3>
          <p className="text-sm text-slate-500 max-w-sm">
            请尝试切换其他筛选条件，或联系行政负责人派发新的周会待办。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => setDetailTaskId(task.id)}
              onMutationSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
              }}
            />
          ))}
        </div>
      )}

      {/* 详情抽屉 */}
      {detailTaskId && (
        <TaskDetailDrawer
          taskId={detailTaskId}
          onClose={() => setDetailTaskId(null)}
          onMutationSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'primary' | 'blue' | 'amber' | 'emerald';
}) {
  const colorMap = {
    primary: 'bg-primary/5 text-primary border-primary/10',
    blue: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  return (
    <div className={cn('card-base p-5 border', colorMap[color])}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-600 mb-2">{label}</div>
          <div className="text-3xl font-bold font-mono tabular-nums">
            {value}
          </div>
        </div>
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            color === 'primary'
              ? 'bg-primary/10'
              : color === 'blue'
                ? 'bg-sky-100/70'
                : color === 'amber'
                  ? 'bg-amber-100/70'
                  : 'bg-emerald-100/70'
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
