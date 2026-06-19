import type { ReactNode } from 'react';
import clsx from 'clsx';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  deltaType = 'neutral',
  icon,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {delta && (
            <p
              className={clsx('mt-1 text-xs font-medium', {
                'text-green-600': deltaType === 'up',
                'text-red-600': deltaType === 'down',
                'text-gray-500': deltaType === 'neutral',
              })}
            >
              {delta}
            </p>
          )}
        </div>
        {icon && <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({
  status,
  type = 'default',
}: {
  status: string;
  type?: 'default' | 'seat' | 'reminder' | 'payment' | 'risk' | 'export';
}) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    trial: 'bg-blue-100 text-blue-800',
    expired: 'bg-red-100 text-red-800',
    suspended: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    not_started: 'bg-gray-100 text-gray-800',
    ended: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-blue-100 text-blue-800',
    read: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    retrying: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    urgent: 'bg-red-100 text-red-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  };

  const labels: Record<string, string> = {
    active: '正常',
    inactive: '停用',
    trial: '试用中',
    expired: '已过期',
    suspended: '已暂停',
    in_progress: '进行中',
    not_started: '未开始',
    ended: '已结束',
    pending: '待处理',
    sent: '已发送',
    read: '已读',
    dismissed: '已忽略',
    success: '成功',
    failed: '失败',
    retrying: '重试中',
    resolved: '已处理',
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '紧急',
    info: '通知',
    warning: '警告',
    urgent: '紧急',
    processing: '处理中',
    completed: '已完成',
  };

  return (
    <span className={clsx('badge', styles[status] || 'bg-gray-100 text-gray-800')}>
      {labels[status] || status}
    </span>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="text-sm text-gray-500">
        显示 <span className="font-medium">{start}</span> - <span className="font-medium">{end}</span> 条，共{' '}
        <span className="font-medium">{total}</span> 条
      </div>
      <div className="flex items-center gap-2">
        <button
          className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          上一页
        </button>
        <span className="text-sm text-gray-600">
          第 {page} / {totalPages || 1} 页
        </span>
        <button
          className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ message = '暂无数据' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function calcUsagePercent(used: number, quota: number): number {
  if (quota <= 0) return 0;
  return Math.round((used / quota) * 100);
}
