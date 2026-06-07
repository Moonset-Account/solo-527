import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
}

export const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'default',
  loading = false
}) => {
  const colorClasses = {
    default: 'bg-zinc-50 text-zinc-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600'
  };

  const iconColorClasses = {
    default: 'text-zinc-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-rose-600'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-zinc-500';

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-zinc-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-zinc-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-zinc-200 rounded w-32"></div>
          </div>
          <div className="h-10 w-10 bg-zinc-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-zinc-500 font-medium mb-2">{title}</p>
          <p className="text-2xl font-bold text-zinc-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-zinc-400">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon size={14} className={trendColor} />
              <span className={`text-xs ${trendColor}`}>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} className={iconColorClasses[color]} />
        </div>
      </div>
    </div>
  );
};
