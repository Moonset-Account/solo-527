import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatsCard({ title, value, icon, trend, trendUp, className }: StatsCardProps) {
  return (
    <div className={cn('bg-white rounded-xl p-5 border border-gray-100 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5">{value}</p>
          {trend && (
            <p className={cn(
              'text-sm mt-1.5 font-medium',
              trendUp ? 'text-emerald-600' : 'text-red-600'
            )}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className="w-11 h-11 rounded-lg bg-blue-900/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}
