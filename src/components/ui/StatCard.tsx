interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function StatCard({ title, value, icon, trend, subtitle, className = '', style }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-card border border-slate-100 p-6 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 ${className}`}
      style={style}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
          {trend && (
            <div className={`mt-2 inline-flex items-center gap-1 text-sm font-medium ${trend.positive ? 'text-success-600' : 'text-danger-600'}`}>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend.positive ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
              </svg>
              {trend.value}
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
