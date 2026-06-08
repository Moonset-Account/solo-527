import { cn } from '@/lib/utils'

interface MetricsChartProps {
  delay: number
  cost: number
  satisfaction: number
  maxDelay: number
  maxCost: number
}

export default function MetricsChart({ delay, cost, satisfaction, maxDelay, maxCost }: MetricsChartProps) {
  const delayPct = maxDelay > 0 ? Math.min((delay / maxDelay) * 100, 100) : 0
  const costPct = maxCost > 0 ? Math.min((cost / maxCost) * 100, 100) : 0
  const satPct = Math.min(satisfaction, 100)

  const metrics = [
    { label: '延迟', value: delay, pct: delayPct, color: '#ef4444' },
    { label: '成本', value: cost, pct: costPct, color: '#ff6b35' },
    { label: '满意度', value: satisfaction, pct: satPct, color: '#00c9a7' },
  ]

  return (
    <div className="flex gap-4 items-end" style={{ backgroundColor: '#1a2332' }}>
      {metrics.map((m) => (
        <div key={m.label} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full h-24 flex items-end">
            <div
              className={cn('w-full rounded-t transition-all duration-500')}
              style={{ height: `${m.pct}%`, backgroundColor: m.color }}
            />
          </div>
          <span className="text-xs font-semibold" style={{ color: m.color }}>
            {m.label}
          </span>
          <span className="text-[11px] text-gray-400">
            {m.label === '满意度' ? `${Math.round(m.value)}%` : Math.round(m.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
