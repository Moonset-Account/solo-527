'use client';

import { cn, STATUS_LABEL } from '@/lib/utils';
import type { TaskStatus } from '@/types';

interface Props {
  counts: Record<string, number>;
  active: TaskStatus | 'ALL';
  onChange: (s: TaskStatus | 'ALL') => void;
}

const TABS: Array<{ key: TaskStatus | 'ALL'; label: string; dot?: string }> = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING_CLAIM', label: '待认领', dot: 'bg-slate-400' },
  { key: 'IN_PROGRESS', label: '进行中', dot: 'bg-sky-500' },
  { key: 'DELAYED', label: '已延期', dot: 'bg-amber-500' },
  { key: 'COMPLETED', label: '已完成', dot: 'bg-emerald-500' },
];

export function StatusTabs({ counts, active, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {TABS.map((tab) => {
        const count = counts[tab.key] || 0;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'tab-pill',
              isActive ? 'tab-pill-active' : 'tab-pill-inactive'
            )}
          >
            {tab.dot && <span className={cn('w-1.5 h-1.5 rounded-full', tab.dot)} />}
            {tab.label}
            <span
              className={cn(
                'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold min-w-[20px] text-center tabular-nums',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
