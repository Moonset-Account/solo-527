import { cn } from '@/lib/utils';
import type { ConfidenceLevel } from '#shared/types';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  value?: number;
  size?: 'sm' | 'md';
  showText?: boolean;
}

const levelConfig: Record<ConfidenceLevel, { bg: string; text: string; ring: string; label: string }> = {
  high: { bg: 'bg-emerald-500/15', text: 'text-emerald-700', ring: 'ring-emerald-500/30', label: '高置信度' },
  medium: { bg: 'bg-amber-400/20', text: 'text-amber-700', ring: 'ring-amber-400/40', label: '中置信度' },
  low: { bg: 'bg-orange-500/15', text: 'text-orange-700', ring: 'ring-orange-500/30', label: '低置信度' },
  unknown: { bg: 'bg-rose-500/15', text: 'text-rose-700', ring: 'ring-rose-500/30', label: '未知' },
};

export default function ConfidenceBadge({ level, value, size = 'sm', showText = true }: ConfidenceBadgeProps) {
  const cfg = levelConfig[level];
  const sizeCls = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset',
        cfg.bg,
        cfg.text,
        cfg.ring,
        sizeCls
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', level === 'high' ? 'bg-emerald-500' : level === 'medium' ? 'bg-amber-400' : level === 'low' ? 'bg-orange-500' : 'bg-rose-500')} />
      {showText && (
        <span>
          {typeof value === 'number' ? `${Math.round(value * 100)}%` : cfg.label}
        </span>
      )}
      {typeof value === 'number' && showText && (
        <span className="opacity-60 ml-0.5">{cfg.label}</span>
      )}
    </span>
  );
}
