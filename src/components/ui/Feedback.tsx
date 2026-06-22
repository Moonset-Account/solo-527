import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2
      className={cn('animate-spin text-primary-600', sizes[size], className)}
    />
  );
};

interface LoadingProps {
  text?: string;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ text = '加载中...', className }) => (
  <div className={cn('flex flex-col items-center justify-center py-12', className)}>
    <Spinner size="lg" />
    <p className="mt-4 text-sm text-slate-500">{text}</p>
  </div>
);

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
  >
    {icon && <div className="mb-4 text-slate-400">{icon}</div>}
    <h3 className="text-lg font-medium text-slate-900 font-serif">{title}</h3>
    {description && (
      <p className="mt-2 text-sm text-slate-500 max-w-sm">{description}</p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  className,
}) => (
  <div className={cn('mb-6 flex items-center justify-between', className)}>
    <div>
      <h1 className="text-2xl font-bold text-slate-900 font-serif">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  className,
}) => (
  <div className={cn('card p-6', className)}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        {trend && (
          <p
            className={cn(
              'mt-2 text-sm font-medium',
              trend.isPositive ? 'text-success-600' : 'text-danger-600'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            <span className="text-slate-500 font-normal"> vs 上周</span>
          </p>
        )}
      </div>
      {icon && (
        <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
          {icon}
        </div>
      )}
    </div>
  </div>
);
