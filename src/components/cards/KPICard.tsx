import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  onClick?: () => void;
}

const colorClasses = {
  blue: 'from-blue-500 to-cyan-400',
  green: 'from-emerald-500 to-teal-400',
  orange: 'from-orange-500 to-amber-400',
  purple: 'from-purple-500 to-indigo-400',
  red: 'from-red-500 to-rose-400',
};

const iconBgClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  orange: 'bg-orange-100 text-orange-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600',
};

export default function KPICard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue',
  onClick,
}: KPICardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        onClick && 'cursor-pointer'
      )}
    >
      <div className={cn(
        'absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 transition-opacity group-hover:opacity-20',
        colorClasses[color]
      )} />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{value}</span>
              {unit && <span className="text-sm text-slate-500">{unit}</span>}
            </div>
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconBgClasses[color])}>
            <Icon size={20} />
          </div>
        </div>

        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1.5">
            {trend >= 0 ? (
              <TrendingUp size={14} className="text-emerald-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className={cn(
              'text-xs font-medium',
              trend >= 0 ? 'text-emerald-600' : 'text-red-600'
            )}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            {trendLabel && <span className="text-xs text-slate-400">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
