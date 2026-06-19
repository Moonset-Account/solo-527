'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface DataTableProps {
  columns: {
    key: string;
    header: string;
    render?: (row: any) => ReactNode;
    className?: string;
  }[];
  data: any[];
  emptyText?: string;
  rowKey?: (row: any) => string;
  className?: string;
  onRowClick?: (row: any) => void;
}

export function DataTable({
  columns,
  data,
  emptyText = '暂无数据',
  rowKey,
  className,
  onRowClick,
}: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className={cn('card p-10 flex flex-col items-center justify-center text-slate-400', className)}>
        <Inbox className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn('th', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row, idx) => {
              const k = rowKey ? rowKey(row) : String(row.id ?? idx);
              return (
                <tr
                  key={k}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
                    onRowClick && 'cursor-pointer hover:bg-brand-50/40 transition-colors',
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('td', c.className)}>
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: ReactNode;
  accent?: 'default' | 'success' | 'warn' | 'danger';
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  trend,
  trendUp,
  icon,
  accent = 'default',
  onClick,
}: StatCardProps) {
  const accentMap = {
    default: 'from-brand-50 to-brand-100 text-brand-600',
    success: 'from-emerald-50 to-emerald-100 text-emerald-600',
    warn: 'from-amber-50 to-amber-100 text-amber-600',
    danger: 'from-red-50 to-red-100 text-red-600',
  } as const;
  return (
    <div
      onClick={onClick}
      className={cn(
        'card p-5 transition-all duration-200 hover:shadow-card-hover',
        onClick && 'cursor-pointer',
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </div>
          {trend && (
            <div
              className={cn(
                'mt-1 text-xs font-medium',
                trendUp ? 'text-emerald-600' : 'text-red-500',
              )}
            >
              {trendUp ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'w-11 h-11 rounded-lg flex items-center justify-center bg-gradient-to-br',
              accentMap[accent],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn('badge', className)}>{children}</span>;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card p-10 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon ?? <Inbox className="w-8 h-8" />}
      </div>
      {title && <div className="font-semibold text-slate-800 mb-1">{title}</div>}
      {description && (
        <div className="text-sm text-slate-500 max-w-sm">{description}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
