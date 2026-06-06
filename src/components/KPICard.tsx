import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  unit?: string;
  status?: 'good' | 'warning' | 'danger';
}

export default function KPICard({ title, value, icon: Icon, trend, unit = '', status = 'good' }: KPICardProps) {
  const statusColors = {
    good: 'from-emerald-400/20 to-emerald-600/10 border-emerald-500/30',
    warning: 'from-amber-400/20 to-amber-600/10 border-amber-500/30',
    danger: 'from-red-400/20 to-red-600/10 border-red-500/30',
  };

  return (
    <div className={`glass-card p-5 bg-gradient-to-br ${statusColors[status]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="stat-number">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <TrendingUp size={14} className="text-emerald-400" />
              ) : (
                <TrendingDown size={14} className="text-red-400" />
              )}
              <span className={`text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-gray-500">较昨日</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-gray-800/50">
          <Icon size={24} className="text-accent-cyan" />
        </div>
      </div>
    </div>
  );
}
