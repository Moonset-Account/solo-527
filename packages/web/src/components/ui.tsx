import { cn } from '../lib/utils';

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function EmptyState({ title, desc, icon }: { title: string; desc?: string; icon?: any }) {
  const I = icon;
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {I && <I size={36} className="mb-3 text-slate-300" />}
      <div className="text-sm font-medium text-slate-700">{title}</div>
      {desc && <div className="mt-1 text-xs text-slate-500">{desc}</div>}
    </div>
  );
}

export function TagBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn('badge', className)}>{children}</span>;
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        className={cn('w-full overflow-hidden rounded-xl bg-white shadow-2xl', width)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyText = '暂无数据',
  footer,
}: {
  columns: { key: string; label: string; render?: (row: T) => React.ReactNode; width?: string }[];
  data: T[];
  rowKey: string | ((row: T) => string);
  onRowClick?: (row: T) => void;
  emptyText?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="table-wrap">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-sm text-slate-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const key = typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={onRowClick ? 'cursor-pointer' : ''}
                  >
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render
                          ? col.render(row)
                          : (row[col.key as keyof T] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (p: number, ps: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <div className="text-slate-500">
        共 <span className="font-semibold text-slate-700">{total}</span> 条，第{' '}
        <span className="font-semibold text-slate-700">{page}</span> / {totalPages} 页
      </div>
      <div className="flex items-center gap-2">
        <select
          className="select h-8 py-1 pr-8 text-xs"
          value={pageSize}
          onChange={(e) => onChange(1, Number(e.target.value))}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} 条/页
            </option>
          ))}
        </select>
        <button
          className="btn-secondary h-8 px-2.5 py-1"
          disabled={page <= 1}
          onClick={() => onChange(page - 1, pageSize)}
        >
          上一页
        </button>
        <button
          className="btn-secondary h-8 px-2.5 py-1"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1, pageSize)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  suffix,
  icon,
  trend,
  color,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon?: any;
  trend?: { value: number; label?: string };
  color?: string;
}) {
  const Icon = icon;
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="stat-label">{label}</div>
          <div className="flex items-baseline gap-1">
            <span className="stat-value">{value}</span>
            {suffix && <span className="text-sm font-medium text-slate-500">{suffix}</span>}
          </div>
          {trend && (
            <div
              className={`mt-2 text-xs ${
                trend.value >= 0 ? 'text-primary-700' : 'text-danger-700'
              }`}
            >
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label || '环比'}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={
              color ||
              'flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600'
            }
          >
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
