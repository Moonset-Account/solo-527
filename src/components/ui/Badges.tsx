'use client';

import { cn, formatCurrency } from '~/lib/utils';
import type { BudgetAlertLevel, ProjectStatus } from '@prisma/client';

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const config: Record<ProjectStatus, { label: string; className: string }> = {
    DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-700' },
    QUOTATION_PENDING: { label: '报价待确认', className: 'bg-warning-100 text-warning-700' },
    QUOTATION_CONFIRMED: { label: '报价已确认', className: 'bg-brand-100 text-brand-700' },
    IN_PROGRESS: { label: '进行中', className: 'bg-primary-100 text-primary-700' },
    INSPECTION: { label: '巡检中', className: 'bg-blue-100 text-blue-700' },
    ACCEPTANCE: { label: '验收中', className: 'bg-purple-100 text-purple-700' },
    COMPLETED: { label: '已完成', className: 'bg-success-100 text-success-600' },
    ON_HOLD: { label: '暂停', className: 'bg-yellow-100 text-yellow-700' },
    CANCELLED: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
  };
  const { label, className } = config[status];
  return (
    <span className={cn('inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-display font-semibold uppercase tracking-wider', className)}>
      {label}
    </span>
  );
}

export function BudgetAlertBadge({ level }: { level: BudgetAlertLevel }) {
  const config: Record<BudgetAlertLevel, { label: string; className: string }> = {
    NORMAL: { label: '正常', className: 'bg-success-100 text-success-600' },
    WARNING: { label: '预警', className: 'bg-warning-100 text-warning-700' },
    CRITICAL: { label: '超支', className: 'bg-danger-100 text-danger-600' },
  };
  const { label, className } = config[level];
  return (
    <span className={cn('inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-display font-semibold uppercase tracking-wider', className)}>
      {label}
    </span>
  );
}

export function BudgetBar({
  usedPercent,
  amount,
  budget,
}: {
  usedPercent: number;
  amount: number | string;
  budget: number | string;
}) {
  const isWarning = usedPercent >= 85 && usedPercent < 100;
  const isCritical = usedPercent >= 100;
  const barColor = isCritical ? 'bg-danger-500' : isWarning ? 'bg-warning-500' : 'bg-brand-500';

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>
          {formatCurrency(amount)} / {formatCurrency(budget)}
        </span>
        <span className={cn(
          'font-display font-semibold tabular-nums',
          isCritical ? 'text-danger-600' : isWarning ? 'text-warning-700' : 'text-navy-600'
        )}>
          {usedPercent.toFixed(1)}%
        </span>
      </div>
      <div className="w-full h-[2.5px] bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${Math.min(usedPercent, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function UserAvatar({ name, role }: { name?: string | null; role?: string }) {
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-navy-800 text-white flex items-center justify-center text-[10px] font-display font-semibold">
        {initial}
      </div>
      <div className="text-sm">
        <div className="text-gray-700 font-medium leading-tight">{name ?? '未分配'}</div>
        {role && <div className="text-xs text-gray-400">{role}</div>}
      </div>
    </div>
  );
}
