'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/formatters';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'orange' | 'green' | 'red';
  warning?: boolean;
  onClick?: () => void;
}

const colorMap = {
  blue: 'from-blue-500 to-blue-600',
  orange: 'from-orange-500 to-orange-600',
  green: 'from-green-500 to-green-600',
  red: 'from-red-500 to-red-600',
};

export default function KPICard({
  title,
  value,
  unit,
  trend,
  trendLabel,
  icon,
  color = 'blue',
  warning = false,
  onClick,
}: KPICardProps) {
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? 'text-red-500' : trend && trend < 0 ? 'text-green-500' : 'text-gray-500';

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all cursor-pointer',
        warning && 'ring-2 ring-warning-400 ring-offset-2'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900 font-mono">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br text-white',
              colorMap[color]
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <TrendIcon className={cn('w-4 h-4', trendColor)} />
          <span className={cn('text-sm', trendColor)}>
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400 ml-1">{trendLabel || '较上周'}</span>
        </div>
      )}
    </div>
  );
}
