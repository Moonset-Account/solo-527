import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: LucideIcon
  title: string
  value: string | number
  trend?: string | { value: number; direction: 'up' | 'down' }
  trendUp?: boolean
  className?: string
}

export default function StatCard({ icon: Icon, title, value, trend, trendUp, className }: StatCardProps) {
  const trendDisplay = typeof trend === 'string'
    ? { text: trend, isUp: trendUp ?? true }
    : trend
      ? { text: `${trend.direction === 'up' ? '+' : ''}${trend.value}%`, isUp: trend.direction === 'up' }
      : null

  return (
    <div className={cn('card flex items-start justify-between', className)}>
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {trendDisplay && (
          <div className="flex items-center gap-1 text-xs font-medium">
            {trendDisplay.isUp ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={trendDisplay.isUp ? 'text-emerald-600' : 'text-red-600'}>
              {trendDisplay.text}
            </span>
          </div>
        )}
      </div>
      <div className="rounded-lg bg-teal-50 p-3">
        <Icon className="h-6 w-6 text-teal-700" />
      </div>
    </div>
  )
}
