import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  suffix?: string;
  trend?: number;
  icon: LucideIcon;
  color: 'primary' | 'accent' | 'success' | 'danger';
  loading?: boolean;
}

export function KPICard({ title, value, suffix, trend, icon: Icon, color, loading }: KPICardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-success-50 text-success-600',
    danger: 'bg-danger-50 text-danger-600',
  };

  const trendColor = (trend ?? 0) >= 0 ? 'text-success-600' : 'text-danger-600';
  const TrendIcon = (trend ?? 0) >= 0 ? ArrowUpRight : ArrowDownRight;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 card-hover">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse-slow mb-3" />
            <div className="h-8 w-28 bg-gray-100 rounded animate-pulse-slow mb-2" />
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse-slow" />
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse-slow" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1.5">{title}</p>
          <p className="text-3xl font-bold text-gray-800 font-display">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-lg text-gray-500 font-normal ml-1">{suffix}</span>}
          </p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span>{Math.abs(trend).toFixed(1)}%</span>
              <span className="text-gray-400 font-normal ml-1">较上期</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
