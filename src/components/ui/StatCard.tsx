import { cn } from '~/lib/utils';

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'light',
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  variant?: 'light' | 'dark';
}) {
  return (
    <div className={variant === 'dark' ? 'card-dark' : 'card'}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className={cn('text-sm font-medium', variant === 'dark' ? 'text-navy-300' : 'text-gray-500')}>
            {title}
          </p>
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            variant === 'dark' ? 'bg-navy-700 text-brand-400' : 'bg-gray-50 text-gray-500'
          )}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className={cn(
            'font-display font-bold tabular-nums',
            variant === 'dark' ? 'text-brand-500 text-3xl' : 'text-navy-800 text-2xl'
          )}>
            {value}
          </p>
          {trend && (
            <p className={cn('text-xs mt-1', variant === 'dark' ? 'text-navy-400' : 'text-gray-500')}>
              {trend}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
