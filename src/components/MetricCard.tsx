import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  value: number | string
  label: string
  trend?: 'up' | 'down'
  trendValue?: string
  subValue?: string
  anomaly?: boolean
}

export default function MetricCard({ value, label, trend, trendValue, subValue, anomaly }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100 metric-card-hover">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${anomaly ? 'text-red-500' : 'text-slate-800'}`}>{value}</span>
        {trend && trendValue && (
          <span className={`flex items-center text-sm font-medium mb-0.5 ${trend === 'up' ? 'text-red-500' : 'text-emerald-500'}`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trendValue}
          </span>
        )}
      </div>
      {subValue && <div className="text-xs text-slate-400 mt-1">{subValue}</div>}
    </div>
  )
}
