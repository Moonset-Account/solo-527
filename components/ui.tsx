'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface StatusBadgeProps {
  status: string;
  children?: ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const map: Record<string, string> = {
    pending: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    in_progress: 'bg-brand-50 text-brand-700 border-brand-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    suspended: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    not_started: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    delayed: 'bg-danger-50 text-danger-600 border-danger-200',
    draft: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    pending_confirm: 'bg-warn-50 text-warn-600 border-warn-200',
    confirmed: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-danger-50 text-danger-600 border-danger-200',
    rectifying: 'bg-warn-50 text-warn-600 border-warn-200',
    processing: 'bg-brand-50 text-brand-700 border-brand-200',
    closed: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    low: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    medium: 'bg-warn-50 text-warn-600 border-warn-200',
    high: 'bg-danger-50 text-danger-600 border-danger-200',
  };
  const labelMap: Record<string, string> = {
    pending: '待启动',
    in_progress: '进行中',
    completed: '已完成',
    suspended: '已暂停',
    not_started: '未开始',
    delayed: '已延期',
    draft: '草稿',
    pending_confirm: '待确认',
    confirmed: '已确认',
    rejected: '已驳回',
    rectifying: '整改中',
    processing: '处理中',
    closed: '已关闭',
    low: '低优先',
    medium: '中优先',
    high: '高优先',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
        map[status] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200',
        className
      )}
    >
      {children ?? labelMap[status] ?? status}
    </span>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warn';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonProps) {
  const variants = {
    primary: 'bg-brand-700 text-white hover:bg-brand-800 focus-visible:outline-brand-700',
    secondary: 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50',
    ghost: 'text-zinc-600 hover:bg-zinc-100',
    danger: 'bg-danger-600 text-white hover:bg-danger-700',
    warn: 'bg-warn-500 text-white hover:bg-warn-600',
  };
  const sizes = {
    sm: 'h-7 px-3 text-xs rounded',
    md: 'h-9 px-4 text-sm rounded',
    lg: 'h-11 px-6 text-sm rounded',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  extra?: ReactNode;
}

export function Card({ children, className, title, extra }: CardProps) {
  return (
    <div className={cn('rounded border border-zinc-200 bg-white', className)}>
      {(title || extra) && (
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
          {typeof title === 'string' ? (
            <h3 className="font-serif text-sm font-semibold text-zinc-900">{title}</h3>
          ) : (
            title
          )}
          {extra}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

interface DataTableColumn<T> {
  key: string;
  title: string;
  width?: string;
  render?: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey?: (row: T) => string;
  className?: string;
  emptyText?: string;
  highlightRow?: (row: T) => boolean;
}

export function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  className,
  emptyText = '暂无数据',
  highlightRow,
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto scrollbar-thin', className)}>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-2.5"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-zinc-400"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => {
              const key = rowKey ? rowKey(row) : String(i);
              const highlight = highlightRow ? highlightRow(row) : false;
              return (
                <tr
                  key={key}
                  className={cn(
                    'transition-colors hover:bg-zinc-50/80',
                    i % 2 === 1 && 'bg-zinc-50/40',
                    highlight && 'bg-danger-50/70 animate-breath-border'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-3 text-zinc-700">
                      {col.render ? col.render(row, i) : String((row as any)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
